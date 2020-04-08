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

    this.state = extend ({ scrollTop: 0,
                           alignScrollLeft: 0 },
                         props,
                         { view });

    this.rowsRef = React.createRef()
  }

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

  // get tree collapsed/open state
  getComputedView (view) {
    view = view || this.state.view
    const { treeIndex, alignIndex } = this.state
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
    const computedView = this.getComputedView()
    const treeLayout = this.layoutTree (computedView)
    const alignLayout = this.layoutAlignment (computedView)

    // record the dimensions for drag handling
    this.treeHeight = treeLayout.treeHeight
    this.alignWidth = alignLayout.alignWidth
    
    return (
        <div className="MSA"
      onMouseDown={this.handleMouseDown.bind(this)}
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
      scrollTop={this.state.scrollTop}
      handleNodeClick={this.handleNodeClick.bind(this)}
        />

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
      scrollTop={this.state.scrollTop}
        />
      
        <MSAAlignRows
      ref={this.rowsRef}
      data={this.state.data}
      view={this.state.view}
      config={this.state.config}
      computedFontConfig={this.state.computedFontConfig}
      treeIndex={this.state.treeIndex}
      alignIndex={this.state.alignIndex}
      treeLayout={treeLayout}
      alignLayout={alignLayout}
      setClientSize={this.setAlignmentClientSize.bind(this)}
      handleScroll={this.handleAlignmentScroll.bind(this)}
      handleMouseDown={this.handleAlignmentMouseDown.bind(this)}
      handleClick={this.handleAlignmentClick.bind(this)}
      scrollLeft={this.state.alignScrollLeft}
      scrollTop={this.state.scrollTop}
        />
        </div>

        <MSAStructs
      config={this.state.config}
      MSA={this} />

      </div>
    )
  }

  componentDidMount() {
    window.addEventListener ('mouseleave', this.handleMouseLeave.bind(this))
    window.addEventListener ('mouseup', this.handleMouseUp.bind(this))
    window.addEventListener ('mousemove', this.handleMouseMove.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener ('mouseleave', this.handleMouseLeave.bind(this))
    window.removeEventListener ('mouseup', this.handleMouseUp.bind(this))
    window.removeEventListener ('mousemove', this.handleMouseMove.bind(this))
  }

  setAlignmentClientSize (w, h) {
    this.alignmentClientWidth = w
    this.alignmentClientHeight = h
  }

  handleNodeClick (node) {
    const { treeIndex, alignIndex } = this.props
    const { collapsed, nodeScale, columnScale, forceDisplayNode, columnVisible } = this.getComputedView()

    const collapseAnimationFrames = 10
    const collapseAnimationDuration = 200
    const collapseAnimationMaxFrameSkip = 8

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
    let newlyVisibleColumns = [], newlyHiddenColumns = []
    for (let col = 0; col < alignIndex.columns; ++col)
      if (finalComputedView.columnVisible[col] !== columnVisible[col])
        (finalComputedView.columnVisible[node] ? newlyVisibleColumns : newlyHiddenColumns).push (col)

    let lastFrameTime = Date.now()
    const expectedTimeBetweenFrames = collapseAnimationDuration / collapseAnimationFrames
    const drawAnimationFrame = () => {
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
      this.setState ({ view: { collapsed: newCollapsed, forceDisplayNode, nodeScale, columnScale, disableTreeEvents, animating } })

      if (framesLeft) {
        const currentTime = Date.now(),
              timeSinceLastFrame = currentTime - lastFrameTime,
              timeToNextFrame = Math.max (0, expectedTimeBetweenFrames - timeSinceLastFrame),
              frameSkip = Math.min (collapseAnimationMaxFrameSkip, Math.ceil (timeSinceLastFrame / expectedTimeBetweenFrames))
        framesLeft = Math.max (0, framesLeft - frameSkip)
        lastFrameTime = currentTime
        setTimeout (drawAnimationFrame, timeToNextFrame)
      }
    }

    drawAnimationFrame (collapseAnimationFrames)
  }
  
  handleAlignmentScroll (alignScrollLeft, scrollTop) {
    this.setState ({ alignScrollLeft, scrollTop })
  }

  handleMouseDown (evt) {
    this.mouseDown = true
    this.lastY = evt.pageY
  }

  handleAlignmentMouseDown (evt) {
    this.alignMouseDown = true
    this.lastX = evt.pageX
  }

  handleAlignmentClick() {
    this.panning = this.scrolling = false
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
  
  handleMouseMove (evt) {
    if (this.alignMouseDown || this.mousedown)
      evt.preventDefault()

    let { alignScrollLeft, scrollTop } = this.state, updated = false
    if (this.alignMouseDown) {
      const dx = evt.pageX - this.lastX
      if (dx) {
        alignScrollLeft = Math.max (0, Math.min (this.alignWidth - this.alignmentClientWidth, alignScrollLeft - dx))
        this.panning = true
        updated = true
      }
    } else
      this.panning = false

    if (this.mouseDown) {
      const dy = evt.pageY - this.lastY
      if (dy) {
        scrollTop = Math.max (0, Math.min (this.treeHeight - this.alignmentClientHeight, scrollTop - dy))
        this.scrolling = true
        updated = true
      }
    } else
      this.scrolling = false

    if (updated) {
      const nextScrollUpdate = { pageX: evt.pageX,
                                 pageY: evt.pageY,
                                 alignScrollLeft,
                                 scrollTop }
      if (!this.nextScrollUpdate)
        window.requestAnimationFrame (this.updateScroll.bind(this))
      this.nextScrollUpdate = nextScrollUpdate
    }
  }

  updateScroll() {
    const { alignScrollLeft, scrollTop } = this.nextScrollUpdate
    this.setState ({ alignScrollLeft, scrollTop })
    this.lastX = this.nextScrollUpdate.pageX
    this.lastY = this.nextScrollUpdate.pageY
    delete this.nextScrollUpdate
  }
}

export default MSA;
