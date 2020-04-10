import React, { Component } from 'react';
import { extend } from 'lodash';
import colorSchemes from './colorSchemes'
import './App.css';

import { getAncestralReconstruction } from './reconstruction';
// eslint-disable-next-line import/no-webpack-loader-syntax
import getAncestralReconstructionWorker from 'workerize-loader!./reconstruction';

import Stockholm from 'stockholm-js';
import Newick from 'newick-js';
import JukesCantor from 'jukes-cantor';
import RapidNeighborJoining from 'neighbor-joining';

import MSA from './MSA';

class App extends Component {
  
  constructor(props) {
    super(props);
    
    // config
    const config = extend (this.defaultConfig(), props.config || {})
    const { genericRowHeight, nameFontSize, treeWidth, branchStrokeStyle, nodeHandleRadius, nodeHandleClickRadius, nodeHandleFillStyle, collapsedNodeHandleFillStyle, rowConnectorDash } = config

    // data
    const data = this.getData (extend ({}, props.data), config)
    const treeIndex = this.buildTreeIndex (data)
    const alignIndex = this.buildAlignmentIndex (data)

    // tree configuration
    const treeStrokeWidth = 1
    const nodeHandleStrokeStyle = branchStrokeStyle
    const availableTreeWidth = treeWidth - nodeHandleRadius - 2*treeStrokeWidth
    const scrollbarHeight = 20  // hack, could be platform-dependent, a bit fragile...
    const computedTreeConfig = { treeWidth, availableTreeWidth, genericRowHeight, branchStrokeStyle, nodeHandleStrokeStyle, nodeHandleRadius, nodeHandleClickRadius, nodeHandleFillStyle, collapsedNodeHandleFillStyle, rowConnectorDash, treeStrokeWidth, scrollbarHeight }

    // font configuration
    const charFontName = 'Menlo,monospace'
    const nameFontName = 'inherit'
    const nameFontColor = 'black'
    const charFont = genericRowHeight + 'px ' + charFontName
    const color = config.color || colorSchemes[config.colorScheme]
    const computedFontConfig = { charFont, charFontName, color, nameFontName, nameFontSize, nameFontColor, genericRowHeight }
    
    // state
    this.state = { config,
                   data,
                   treeIndex,
                   alignIndex,
                   computedTreeConfig,
                   computedFontConfig }
  }

  // method to get data & build tree if necessary
  get pdbRegex() { return /PDB; +(\S+) +(\S); ([0-9]+)/; }   /* PFAM format for embedding PDB IDs in Stockholm files */
  getData (data, config) {
    const structure = data.structure = data.structure || {}
    if (!(data.branches && data.rowData)) {
      let newickStr = data.newick  // was a Newick-format tree specified?
      if (data.stockholm) {  // was a Stockholm-format alignment specified?
        const stock = Stockholm.parse (data.stockholm)
        data.rowData = stock.seqdata
        if (stock.gf.NH && !newickStr)  // did the Stockholm alignment include a tree?
          newickStr = stock.gf.NH.join('')
        if (stock.gs.DR && (config.loadFromPDB || (config.structure && config.structure.loadFromPDB)))  // did the Stockholm alignment include links to PDB?
          Object.keys(stock.gs.DR).forEach ((node) => {
            stock.gs.DR[node].forEach ((dr) => {
              const match = this.pdbRegex.exec(dr)
              if (match)
                structure[node] = { pdbFile: match[1].toLowerCase(),
                                    chain: match[2],
                                    startPos: parseInt (match[3]),
                                    loadFromPDB: true }
            })
          })
      } else if (data.fasta)  // was a FASTA-format alignment specified
        data.rowData = this.parseFasta (data.fasta)
      else
        throw new Error ("no sequence data")
      // If a Newick-format tree was specified somehow (as a separate data item, or in the Stockholm alignment) then parse it
      if (newickStr) {
        const newickTree = Newick.parse (newickStr)
        let nodes = 0
        const getName = (obj) => (obj.name = obj.name || ('node' + (++nodes)))
        data.branches = []
        const traverse = (parent) => {  // auto-name internal nodes
          if (parent.branchset)
            parent.branchset.forEach ((child) => {
              data.branches.push ([getName(parent), getName(child), Math.max (child.length, 0)])
              traverse (child)
            })
        }
        traverse (newickTree)
        data.root = getName (newickTree)
      } else {  // no Newick tree was specified, so build a quick-and-dirty distance matrix with Jukes-Cantor, and get a tree by neighbor-joining
        console.warn ('Estimating phylogenetic tree...')
        const taxa = Object.keys(data.rowData).sort(), seqs = taxa.map ((taxon) => data.rowData[taxon])
        const distMatrix = JukesCantor.calcDistanceMatrix (seqs)
        const rnj = new RapidNeighborJoining.RapidNeighborJoining (distMatrix, taxa.map ((name) => ({ name })))
        rnj.run()
        const tree = rnj.getAsObject()
        let nodes = 0
        const getName = (obj) => { obj.taxon = obj.taxon || { name: 'node' + (++nodes) }; return obj.taxon.name }
        data.branches = []
        const traverse = (parent) => {  // auto-name internal nodes
          parent.children.forEach ((child) => {
            data.branches.push ([getName(parent), getName(child), Math.max (child.length, 0)])
            traverse (child)
          })
        }
        traverse (tree)
        data.root = getName (tree)
      }
    }
    return data
  }

  componentDidMount() {
    // check if any nodes are missing; if so, do ancestral sequence reconstruction
    const { data } = this.state
    const { branches } = data
    let rowData = extend ({}, data.rowData)
    const missingAncestors = data.branches.filter ((b) => typeof(rowData[b[0]]) === 'undefined').length
    if (missingAncestors) {
      if (window.Worker) {
        console.warn ('Reconstructing ancestral sequences in web worker...')
        let instance = getAncestralReconstructionWorker()
        instance.getAncestralReconstruction ({ branches, rowData })
          .then ((ancestralRowData) => {
            console.warn ('Ancestral sequence reconstruction complete')
            this.incorporateAncestralReconstruction (ancestralRowData)
          })
      } else {
        console.warn ('Reconstructing ancestral sequences...')
        getAncestralReconstruction ({ branches, rowData })
          .then ((ancestralRowData) => {
            this.incorporateAncestralReconstruction (ancestralRowData)
          })
      }
    }
  }

  fn2workerURL (fn) {
    const blob = new Blob(['('+fn.toString()+')()'], {type: 'application/javascript'})
    return URL.createObjectURL(blob)
  }
  
  incorporateAncestralReconstruction (ancestralRowData) {
    const { data } = this.state
    const rowData = extend ({}, data.rowData, ancestralRowData)
    extend (data, { rowData })
    this.setState ({ data })
  }

  defaultColorScheme() { return 'maeditor' }
  defaultConfig() {
    return {
      treeAlignHeight: 400,
      genericRowHeight: 24,
      nameFontSize: 12,
      containerHeight: '100%',
      containerWidth: '100%',
      treeWidth: 200,
      nameDivWidth: 200,
      branchStrokeStyle: 'black',
      nodeHandleRadius: 4,
      nodeHandleClickRadius: 40,
      nodeHandleFillStyle: 'white',
      collapsedNodeHandleFillStyle: 'black',
      rowConnectorDash: [2,2],
      structure: { width: 300, height: 300 },
      handler: {},
      colorScheme: this.defaultColorScheme()
    } }

  // method to parse FASTA (simple enough to build in here)
  parseFasta (fasta) {
    let seq = {}, name, re = /^>(\S+)/;
    fasta.split("\n").forEach ((line) => {
      const match = re.exec(line)
      if (match)
        seq[name = match[1]] = ''
      else if (name)
        seq[name] = seq[name] + line.replace(/[ \t]/g,'')
    })
    return seq
  }

  // index tree
  buildTreeIndex (data) {
    const { branches } = data
    let { root } = data, rootSpecified = typeof(root) !== 'undefined'
    const roots = this.getRoots (branches)
    if (roots.length === 0 && (branches.length > 0 || !rootSpecified))
      throw new Error ("No root nodes")
    if (rootSpecified) {
      if (roots.indexOf(root) < 0)
        throw new Error ("Specified root node is not a root")
    } else {
      if (roots.length !== 1)
        throw new Error ("Multiple possible root nodes, and no root specified")
      root = roots[0]
    }
    let children = {}, branchLength = {}
    children[root] = []
    branchLength[root] = 0
    branches.forEach ((branch) => {
      const parent = branch[0], child = branch[1], len = branch[2]
      children[parent] = children[parent] || []
      children[child] = children[child] || []
      children[parent].push (child)
      branchLength[child] = len
    })
    let nodes = [], seenNode = {}, descendants = {}, distFromRoot = {}, maxDistFromRoot = 0
    const addNode = (node) => {
      if (!node)
        throw new Error ("All nodes must be named")
      if (seenNode[node])
        throw new Error ("All node names must be unique (duplicate '" + node + "')")
      seenNode[node] = true
      nodes.push (node)
    }
    const addSubtree = (node, parent) => {
      distFromRoot[node] = (typeof(parent) !== 'undefined' ? distFromRoot[parent] : 0) + branchLength[node]
      maxDistFromRoot = Math.max (maxDistFromRoot, distFromRoot[node])
      const kids = children[node]
      let clade = []
      if (kids.length === 2) {
        clade = clade.concat (addSubtree (kids[0], node))
        addNode (node)
        clade = clade.concat (addSubtree (kids[1], node))
      } else {
        addNode (node)
        kids.forEach ((child) => clade = clade.concat (addSubtree (child, node)))
      }
      descendants[node] = clade
      return [node].concat (clade)
    }
    addSubtree (root)
    return { root, branches, children, descendants, branchLength, nodes, distFromRoot, maxDistFromRoot }
  }

  // get the root node(s) of a list of [parent,child,length] branches
  getRoots (branches) {
    const isNode = {}, hasParent = {}
    branches.forEach ((branch) => {
      const [p, c] = branch
      isNode[p] = isNode[c] = hasParent[c] = true
    })
    return Object.keys(isNode).filter ((n) => !hasParent[n]).sort()
  }

  // index alignment
  buildAlignmentIndex (data) {
    const { rowData } = data
    let rowDataAsArray = {}, alignColToSeqPos = {}, seqPosToAlignCol = {}, isChar = {}, columns
    Object.keys(rowData).forEach ((node) => {
      const row = rowData[node]
      if (typeof(columns) !== 'undefined' && columns !== row.length)
        console.error ("Inconsistent row lengths")
      columns = row.length
      let pos2col = [], pos = 0
      const rowAsArray = typeof(row) === 'string' ? row.split('') : row
      alignColToSeqPos[node] = rowAsArray.map ((c, col) => {
        if (typeof(c) === 'string')
          isChar[c] = true
        const isGap = this.isGapChar(c)
        if (!isGap)
          pos2col.push (col)
        return isGap ? pos : pos++
      })
      rowDataAsArray[node] = rowAsArray
      seqPosToAlignCol[node] = pos2col
    })
    const chars = Object.keys(isChar).sort()
    return { alignColToSeqPos, rowDataAsArray, columns, chars }
  }

  // helper to recognize gap characters
  isGapChar (c) { return typeof(c) === 'string' ? (c === '-' || c === '.') : (!c || Object.keys(c).length === 0) }

  render() {
    return (
        <div className="App">
        <MSA
      data={this.state.data}
      isGapChar={this.isGapChar.bind(this)}
      config={this.state.config}
      view={this.state.view}
      treeIndex={this.state.treeIndex}
      alignIndex={this.state.alignIndex}
      computedTreeConfig={this.state.computedTreeConfig}
      computedFontConfig={this.state.computedFontConfig}
        />
        </div>
    );
  }
}

export default App;
