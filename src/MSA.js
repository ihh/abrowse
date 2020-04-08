import React, { Component } from 'react';
import { extend } from 'lodash';

import MSATree from './MSATree';
import MSAAlignNames from './MSAAlignNames';
import MSAAlignRows from './MSAAlignRows';
import MSAStructs from './MSAStructs';

class MSA extends Component {
  constructor(props) {
    super(props);

    const view = extend (this.initialView(),
                         props.view || {})

    this.state = extend ({}, props, { view });
  }

  initialView() {
    return {
      collapsed: {},   // true if an internal node has been collapsed by the user
      forceDisplayNode: {},   // force a node to be displayed even if it's flagged as collapsed. Used by animation code
      nodeScale: {},  // height scaling factor for tree nodes / alignment rows. From 0 to 1 (undefined implies 1)
      columnScale: {},  // height scaling factor for alignment columns. From 0 to 1 (undefined implies 1)
      scrollTop: 0,
      scrollLeft: 0,
      disableTreeEvents: false,
      structure: { openStructures: [] }
    } }

  // get tree collapsed/open state
  getComputedView() {
    const { treeIndex, alignIndex, view } = this.state
    const { collapsed, forceDisplayNode } = view
    const { rowDataAsArray } = alignIndex
    let ancestorCollapsed = {}, nodeVisible = {}
    const setCollapsedState = (node, parent) => {
      ancestorCollapsed[node] = ancestorCollapsed[parent] || collapsed[parent]
      const kids = treeIndex.children[node]
      if (kids)
        kids.forEach ((child) => setCollapsedState (child, node))
    }
    setCollapsedState (treeIndex.root)
    treeIndex.nodes.forEach ((node) => nodeVisible[node] = (!ancestorCollapsed[node]
                                                              && (treeIndex.children[node].length === 0
                                                                  || forceDisplayNode[node])))
    let columnVisible = new Array(alignIndex.columns).fill(false)
    treeIndex.nodes.filter ((node) => nodeVisible[node]).forEach ((node) => {
      if (rowDataAsArray[node])
        rowDataAsArray[node].forEach ((c, col) => { if (!this.state.isGapChar(c)) columnVisible[col] = true })
    })
    return extend ({ ancestorCollapsed, nodeVisible, columnVisible },
                   view)
  }
  
  // layout tree
  layoutTree (computedView) {
    const { computedTreeConfig, treeIndex } = this.state
    const { nodeVisible, nodeScale } = computedView
    const { genericRowHeight, nodeHandleRadius, treeStrokeWidth, availableTreeWidth, scrollbarHeight } = computedTreeConfig
    let nx = {}, ny = {}, computedRowScale = [], nodeHeight = {}, rowHeight = [], treeHeight = 0
    const rowY = treeIndex.nodes.map ((node) => {
      const scale = typeof(nodeScale[node]) !== 'undefined' ? nodeScale[node] : 1
      const rh = scale * (nodeVisible[node] ? genericRowHeight : 0)
      const y = treeHeight
      nx[node] = nodeHandleRadius + treeStrokeWidth + availableTreeWidth * treeIndex.distFromRoot[node] / treeIndex.maxDistFromRoot
      ny[node] = y + rh / 2
      nodeHeight[node] = rh
      computedRowScale.push (scale)
      rowHeight.push (rh)
      treeHeight += rh
      return y
    })
    treeHeight += scrollbarHeight
    return { nx, ny, computedRowScale, nodeHeight, rowHeight, rowY, treeHeight, computedView }
  }

  // get metrics and other info about alignment font/chars, and do layout
  layoutAlignment (computedView) {
    const { alignIndex, computedFontConfig } = this.state
    const { genericRowHeight, charFont } = computedFontConfig
    const alignChars = alignIndex.chars
    let charWidth = 0, charMetrics = {}
    alignChars.forEach ((c) => {
      let measureCanvas = this.create ('canvas', null, { width: genericRowHeight, height: genericRowHeight })
      let measureContext = measureCanvas.getContext('2d')
      measureContext.font = charFont
      charMetrics[c] = measureContext.measureText (c)
      charWidth = Math.max (charWidth, Math.ceil (charMetrics[c].width))
    })
    const charHeight = genericRowHeight

    let nextColX = 0, colX = [], colWidth = [], computedColScale = []
    for (let col = 0; col < alignIndex.columns; ++col) {
      colX.push (nextColX)
      if (computedView.columnVisible[col]) {
        let scale = computedView.columnScale[col]
        if (typeof(scale) === 'undefined')
          scale = 1
        computedColScale.push (scale)
        const width = scale * charWidth
        colWidth.push (width)
        nextColX += width
      } else {
        computedColScale.push (0)
        colWidth.push (0)
      }
    }

    return { charMetrics, charWidth, charHeight, colX, colWidth, computedColScale, alignWidth: nextColX }
  }

  // helper to create DOM element for measurement purposes
  create (type, styles, attrs) {
    const element = document.createElement (type)
    if (attrs)
      Object.keys(attrs).filter ((attr) => typeof(attrs[attr]) !== 'undefined').forEach ((attr) => element.setAttribute (attr, attrs[attr]))
    if (styles)
      element.style = styles
    return element
  }
  
  render() {
    const { data, computedFontConfig, treeIndex, alignIndex, config, view } = this.state
    const { rowData } = data
    const structure = data.structure || {}, structureState = view.structure, structureConfig = config.structure || {}
    const { nameDivWidth } = config
    const { nameFontName, nameFontSize, nameFontColor, charFont, charFontName, genericRowHeight } = computedFontConfig

    const computedView = this.getComputedView()
    const treeLayout = this.layoutTree (computedView)
    const alignLayout = this.layoutAlignment (computedView)
    const { nodeHeight, treeHeight } = treeLayout
    const { alignWidth } = alignLayout

    return (
        <div className="MSA"
      style={{ width: this.state.config.containerWidth,
               height: this.state.config.containerHeight }}>

        <div className="MSA-tree-alignment"
      style={{ width: this.state.config.containerWidth,
               height: treeLayout.treeAlignHeight }}>

        <MSATree
      config={this.state.config}
      computedTreeConfig={this.state.computedTreeConfig}
      treeIndex={this.state.treeIndex}
      treeLayout={treeLayout}
      computedView={computedView}
      visibleHeight={this.state.rowsDivClientHeight}
      MSA={this} />

        <MSAAlignNames
      data={this.state.data}
      view={this.state.view}
      config={this.state.config}
      computedFontConfig={this.state.computedFontConfig}
      treeIndex={this.state.treeIndex}
      alignIndex={this.state.alignIndex}
      treeLayout={treeLayout}
      alignLayout={alignLayout}
      computedView={computedView}
      MSA={this} />
      
        <MSAAlignRows
      data={this.state.data}
      view={this.state.view}
      config={this.state.config}
      computedFontConfig={this.state.computedFontConfig}
      treeIndex={this.state.treeIndex}
      alignIndex={this.state.alignIndex}
      treeLayout={treeLayout}
      alignLayout={alignLayout}
      computedView={computedView}
      MSA={this} />
        </div>

        <MSAStructs
      config={this.state.config}
      MSA={this} />

      </div>
    )
  }
}

export default MSA;
