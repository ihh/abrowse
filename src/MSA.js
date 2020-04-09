import React, { Component } from 'react';
import { extend } from 'lodash';

import MSATree from './MSATree';
import MSAAlignNames from './MSAAlignNames';
import MSAAlignRows from './MSAAlignRows';
import MSAStructPanel from './MSAStructPanel';

class MSA extends Component {
  constructor(props) {
    super(props);

    const view = extend (this.initialView(),
                         props.view || {})

    this.state = extend ({ scrollTop: 0,
                           alignScrollLeft: 0 },
                         { view });

    this.rowsRef = React.createRef()
    this.msaRef = React.createRef()
  }

  // config/defaults
  initialView() {
    return {
      collapsed: {},   // true if an internal node has been collapsed by the user
      forceDisplayNode: {},   // force a node to be displayed even if it's flagged as collapsed. Used by animation code
      nodeScale: {},  // height scaling factor for tree nodes / alignment rows. From 0 to 1 (undefined implies 1)
      columnScale: {},  // height scaling factor for alignment columns. From 0 to 1 (undefined implies 1)
      disableTreeEvents: false,
      animating: false,
      structure: { openStructures: [] }
    } }

  mouseoverLabelDelay() { return 100 }
  redrawStructureDelay() { return 500 }

  collapseAnimationFrames() { return 10 }
  collapseAnimationDuration() { return 200 }
  collapseAnimationMaxFrameSkip() { return 8 }

  // get tree collapsed/open state
  getComputedView (view) {
    view = view || this.state.view
    const { treeIndex, alignIndex } = this.props
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
        rowDataAsArray[node].forEach ((c, col) => { if (!this.props.isGapChar(c)) columnVisible[col] = true })
    })
    return extend ({ ancestorCollapsed, nodeVisible, columnVisible },
                   view)
  }
  
  // layout tree
  layoutTree (computedView) {
    const { computedTreeConfig, treeIndex } = this.props
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
    const { alignIndex, computedFontConfig } = this.props
    const { genericRowHeight, charFont } = computedFontConfig
    const alignChars = alignIndex.chars
    let charWidth = 0, charMetrics = {}
    alignChars.forEach ((c) => {
      let measureCanvas = this.create ('canvas', null, null, { width: genericRowHeight, height: genericRowHeight })
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

  // helper to create DOM element (for measurement purposes, or non-React components)
  create (type, parent, styles, attrs) {
    const element = document.createElement (type)
    if (parent)
      parent.appendChild (element)
    if (attrs)
      Object.keys(attrs).filter ((attr) => typeof(attrs[attr]) !== 'undefined').forEach ((attr) => element.setAttribute (attr, attrs[attr]))
    if (styles)
      element.style = styles
    return element
  }
  
  render() {
    const computedView = this.getComputedView()
    const treeLayout = this.layoutTree (computedView)
    const alignLayout = this.layoutAlignment (computedView)

    // record the dimensions for drag handling
    this.treeHeight = treeLayout.treeHeight
    this.alignWidth = alignLayout.alignWidth
    
    return (
        <div className="MSA"
      ref={this.msaRef}
      style={{ width: this.props.config.containerWidth,
               height: this.props.config.containerHeight }}>

        <div className="MSA-tree-alignment"
      onMouseDown={this.handleMouseDown.bind(this)}
      onMouseLeave={this.removeLabelFromStructuresOnMouseout.bind(this)}
      style={{ width: this.props.config.containerWidth,
               height: treeLayout.treeAlignHeight }}>

        <MSATree
      config={this.props.config}
      computedTreeConfig={this.props.computedTreeConfig}
      treeIndex={this.props.treeIndex}
      treeLayout={treeLayout}
      computedView={computedView}
      scrollTop={this.state.scrollTop}
      handleNodeClick={this.handleNodeClick.bind(this)}
        />

        <MSAAlignNames
      data={this.props.data}
      view={this.state.view}
      config={this.props.config}
      computedFontConfig={this.props.computedFontConfig}
      treeIndex={this.props.treeIndex}
      alignIndex={this.props.alignIndex}
      treeLayout={treeLayout}
      alignLayout={alignLayout}
      computedView={computedView}
      scrollTop={this.state.scrollTop}
      handleNameClick={this.handleNameClick.bind(this)}
        />
      
        <MSAAlignRows
      ref={this.rowsRef}
      data={this.props.data}
      view={this.state.view}
      config={this.props.config}
      computedFontConfig={this.props.computedFontConfig}
      treeIndex={this.props.treeIndex}
      alignIndex={this.props.alignIndex}
      treeLayout={treeLayout}
      alignLayout={alignLayout}
      setClientSize={this.setAlignmentClientSize.bind(this)}
      handleScroll={this.handleAlignmentScroll.bind(this)}
      handleMouseDown={this.handleAlignmentMouseDown.bind(this)}
      handleAlignCharClick={this.handleAlignCharClick.bind(this)}
      handleAlignCharMouseOver={this.handleAlignCharMouseOver.bind(this)}
      handleAlignCharMouseOut={this.handleAlignCharMouseOut.bind(this)}
      scrollLeft={this.state.alignScrollLeft}
      scrollTop={this.state.scrollTop}
        />
        </div>

        <MSAStructPanel
      config={this.props.config}
      structures={this.state.view.structure.openStructures}
      handleCloseStructure={this.handleCloseStructure.bind(this)}
        />

      </div>
    )
  }

  componentDidMount() {
    window.addEventListener ('mouseleave', this.handleMouseLeave.bind(this))
    window.addEventListener ('mouseup', this.handleMouseUp.bind(this))
    window.addEventListener ('mousemove', this.handleMouseMove.bind(this))
    this.msaRef.current.addEventListener ('wheel', this.handleMouseWheel.bind(this), { passive: false })
  }

  componentWillUnmount() {
    window.removeEventListener ('mouseleave', this.handleMouseLeave.bind(this))
    window.removeEventListener ('mouseup', this.handleMouseUp.bind(this))
    window.removeEventListener ('mousemove', this.handleMouseMove.bind(this))
    this.msaRef.current.removeEventListener ('wheel', this.handleMouseWheel.bind(this))
  }

  setAlignmentClientSize (w, h) {
    this.alignmentClientWidth = w
    this.alignmentClientHeight = h
  }

  handleNameClick (node) {
    const { structure } = this.props.data
    this.nStructs = (this.nStructs || 0) + 1
    const newStructure = { node, structureInfo: structure[node], key: this.nStructs }
    let view = this.state.view
    view.structure.openStructures.push (newStructure)
    this.setState ({ view })
  }

  handleCloseStructure (structure) {
    let view = this.state.view
    view.structure.openStructures = view.structure.openStructures.filter ((s) => s !== structure)
    this.setState ({ view })
  }
  
  handleNodeClick (node) {
    if (this.scrolling) {
      this.scrolling = false
      return
    }
    if (this.state.disableTreeEvents)
      return

    const { treeIndex, alignIndex } = this.props
    const computedView = this.getComputedView()
    const { collapsed, nodeScale, columnScale, forceDisplayNode, columnVisible } = computedView

    const alignLayout = this.layoutAlignment (computedView)
    const left = this.state.alignScrollLeft, right = left + this.alignmentClientWidth

    const collapseAnimationFrames = this.collapseAnimationFrames()
    let framesLeft = collapseAnimationFrames

    const wasCollapsed = collapsed[node], finalCollapsed = extend ({}, collapsed)
    if (wasCollapsed) {
      collapsed[node] = false  // when collapsed[node]=false (vs undefined), it's rendered by renderTree() as a collapsed node, but its descendants are still visible. A bit of a hack...
      delete finalCollapsed[node]
    } else
      finalCollapsed[node] = true
    const finalForceDisplayNode = extend ({}, forceDisplayNode)
    finalForceDisplayNode[node] = !wasCollapsed
    const finalComputedView = this.getComputedView ({ collapsed: finalCollapsed, forceDisplayNode: finalForceDisplayNode })
    let newlyVisibleColumns = [], newlyHiddenColumns = [], persistingVisibleColumns = []
    for (let col = 0; col < alignIndex.columns; ++col) {
      if (finalComputedView.columnVisible[col] !== columnVisible[col])
        (finalComputedView.columnVisible[node] ? newlyVisibleColumns : newlyHiddenColumns).push (col)
      const colX = alignLayout.colX[col], colWidth = alignLayout.colWidth[col]
      if (columnVisible[col] && finalComputedView.columnVisible[col] && colX >= left && colX + colWidth < right)
        persistingVisibleColumns.push (col)
    }
    const centroidMinusScroll = this.centroidOfColumns (persistingVisibleColumns, alignLayout) - this.state.alignScrollLeft

    let lastFrameTime = Date.now()
    const expectedTimeBetweenFrames = this.collapseAnimationDuration() / collapseAnimationFrames
    const drawAnimationFrame = () => {
      window.requestAnimationFrame (() => {
        let disableTreeEvents, animating, newCollapsed = collapsed
        if (framesLeft) {
          const scale = (wasCollapsed ? (collapseAnimationFrames + 1 - framesLeft) : framesLeft) / (collapseAnimationFrames + 1)
          treeIndex.descendants[node].forEach ((desc) => { nodeScale[desc] = scale })
          nodeScale[node] = 1 - scale
          newlyHiddenColumns.forEach ((col) => columnScale[col] = scale)
          newlyVisibleColumns.forEach ((col) => columnScale[col] = 1 - scale)
          forceDisplayNode[node] = true
          disableTreeEvents = true
          animating = true
        } else {
          treeIndex.descendants[node].forEach ((desc) => { delete nodeScale[desc] })
          delete nodeScale[node]
          newlyHiddenColumns.forEach ((col) => delete columnScale[col])
          newlyVisibleColumns.forEach ((col) => delete columnScale[col])
          forceDisplayNode[node] = !wasCollapsed
          newCollapsed = finalCollapsed
          disableTreeEvents = false
          animating = false
        }
        const view = extend ({}, this.state.view, { collapsed: newCollapsed, forceDisplayNode, nodeScale, columnScale, disableTreeEvents, animating })
        const computedView = this.getComputedView (view), alignLayout = this.layoutAlignment (computedView)
        const alignScrollLeft = this.boundAlignScrollLeft (this.centroidOfColumns (persistingVisibleColumns, alignLayout) - centroidMinusScroll)
        this.setState ({ alignScrollLeft, view })
        
        if (framesLeft) {
          const currentTime = Date.now(),
                timeSinceLastFrame = currentTime - lastFrameTime,
                timeToNextFrame = Math.max (0, expectedTimeBetweenFrames - timeSinceLastFrame),
                frameSkip = Math.min (this.collapseAnimationMaxFrameSkip(), Math.ceil (timeSinceLastFrame / expectedTimeBetweenFrames))
          framesLeft = Math.max (0, framesLeft - frameSkip)
          lastFrameTime = currentTime
          setTimeout (drawAnimationFrame, timeToNextFrame)
        }
      })
    }
                                    
    drawAnimationFrame (collapseAnimationFrames)
  }

  handleAlignmentScroll (alignScrollLeft, scrollTop) {
    if (alignScrollLeft !== this.state.alignScrollLeft
        || scrollTop !== this.state.scrollTop)
      this.setState ({ alignScrollLeft, scrollTop })
  }

  handleMouseWheel (evt) {
    // nonzero deltaMode is Firefox, means deltaY is in lines instead of pixels
    // can be corrected for e.g. https://stackoverflow.com/questions/20110224/what-is-the-height-of-a-line-in-a-wheel-event-deltamode-dom-delta-line
    if (evt.deltaY !== 0) {
      const deltaY = evt.deltaY * (evt.deltaMode ? this.props.config.genericRowHeight : 1)
      evt.preventDefault()
      this.requestAnimationFrame (() => {
        this.setState ({ alignScrollLeft: this.incAlignScrollLeft (evt.deltaX),
                         scrollTop: this.incScrollTop (deltaY) })
      })
    }
  }

  handleMouseDown (evt) {
    this.mouseDown = true
    this.lastY = evt.pageY
  }

  handleAlignmentMouseDown (evt) {
    this.alignMouseDown = true
    this.lastX = evt.pageX
  }

  handleAlignCharClick (coords) {
    if (!this.panning && !this.scrolling) {
//      console.warn('click',coords)
    }
    this.panning = this.scrolling = false
  }

  handleAlignCharMouseOver (coords) {
    if (!this.panning && !this.scrolling) {
      this.addLabelToStructuresOnMouseover (coords)
//      console.warn('mouseover',coords)
    }
  }

  handleAlignCharMouseOut (coords) {
    if (!this.panning && !this.scrolling) {
      this.removeLabelFromStructuresOnMouseout()
//      console.warn('mouseout',coords)
    }
  }

  addLabelToStructuresOnMouseover (coords) {
    this.setTimer ('mouseover', this.mouseoverLabelDelay(), () => {
      this.state.view.structure.openStructures.forEach ((s) => {
        if (coords.c && !this.props.isGapChar(coords.c) && s.viewer) {
          const colToSeqPos = this.props.alignIndex.alignColToSeqPos[s.node]
          if (colToSeqPos) {
            const seqPos = colToSeqPos[coords.column]
            const pdbSeqPos = seqPos + (typeof(s.structureInfo.startPos) === 'undefined' ? 1 : s.structureInfo.startPos)
            const pdbChain = s.structureInfo.chain
            const residues = s.pdb.residueSelect ((res) => {
              return res.num() === pdbSeqPos
                && (typeof(pdbChain) === 'undefined' || res.chain().name() === pdbChain)
            })
            if (residues) {
              const labelConfig = s.structureInfo.labelConfig || { fontSize : 16,
                                                                   fontColor: '#f22',
                                                                   backgroundAlpha : 0.4 }
              if (s.hasMouseoverLabel)
                s.viewer.rm ('mouseover')
              residues.eachResidue ((res) => {
                s.viewer.label ('mouseover', res.qualifiedName(), res.centralAtom().pos(), labelConfig)
              })
              s.hasMouseoverLabel = true
              this.requestRedrawStructure (s)
            }
          }
        }
      })
    })
  }

  removeLabelFromStructuresOnMouseout() {
    this.clearTimer ('mouseover')
    this.state.view.structure.openStructures.forEach ((s) => {
      if (s.hasMouseoverLabel) {
        s.viewer.rm ('mouseover')
        this.requestRedrawStructure (s)
        delete s.hasMouseoverLabel
      }
    })
  }
  
  handleMouseLeave() {
    this.alignMouseDown = false
    this.mouseDown = false
    this.panning = this.scrolling = false
  }

  handleMouseUp() {
    this.alignMouseDown = false
    this.mouseDown = false
  }

  centroidOfColumns (cols, alignLayout) {
    return cols.reduce ((sum, col) => sum + alignLayout.colX[col] + (alignLayout.colWidth[col] / 2), 0) / cols.length
  }

  incAlignScrollLeft (dx) {
    return this.boundAlignScrollLeft (this.state.alignScrollLeft + dx)
  }

  incScrollTop (dy) {
    return this.boundScrollTop (this.state.scrollTop + dy)
  }

  boundAlignScrollLeft (x) {
    return Math.max (0, Math.min (this.alignWidth - this.alignmentClientWidth, x))
  }

  boundScrollTop (y) {
    return Math.max (0, Math.min (this.treeHeight - this.alignmentClientHeight, y))
  }

  handleMouseMove (evt) {
    if (this.alignMouseDown || this.mousedown)
      evt.preventDefault()

    let { alignScrollLeft, scrollTop } = this.state, updated = false
    if (this.alignMouseDown) {
      const dx = evt.pageX - this.lastX
      if (dx) {
        alignScrollLeft = this.incAlignScrollLeft (-dx)
        this.panning = true
        updated = true
      }
    } else
      this.panning = false

    if (this.mouseDown) {
      const dy = evt.pageY - this.lastY
      if (dy) {
        scrollTop = this.incScrollTop (-dy)
        this.scrolling = true
        updated = true
      }
    } else
      this.scrolling = false

    if (updated)
      this.requestAnimationFrame (() => {
        this.setState ({ alignScrollLeft, scrollTop })
        this.lastX = evt.pageX
        this.lastY = evt.pageY
      })
  }

  // delayed request to redraw structure
  requestRedrawStructure (structure) {
    this.setTimer ('redraw', this.redrawStructureDelay(), () => structure.viewer.requestRedraw())
  }

  // request animation frame
  requestAnimationFrame (callback) {
    if (this.animationTimeout)
      window.cancelAnimationFrame (this.animationTimeout)
    this.animationTimeout = window.requestAnimationFrame (callback)
  }

  // set generic timer
  setTimer (name, delay, callback) {
    this.timer = this.timer || {}
    this.clearTimer (this, name)
    this.timer[name] = window.setTimeout (() => {
      delete this.timer[name]
      callback()
    }, delay)
  }

  // clear generic timer
  clearTimer (name) {
    if (this.timer && this.timer[name]) {
      window.clearTimeout (this.timer[name])
      delete this.timer[name]
    }
  }
}

export default MSA;
