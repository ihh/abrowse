import React, { Component } from 'react';

class MSAAlignCanvas extends Component {
  
  constructor(props) {
    super(props);
    this.state = { clientWidth: 0,
                   clientHeight: 0 }
    this.canvasRef = React.createRef()
  }

  render() {
    const { top, left, width, height } = this.getDimensions()
    return (<canvas
            ref={this.canvasRef}
            className="MSA-alignment-canvas"
            width={width}
            height={height}
            style={{top,left}}
            />)
  }

  getColor (c) {
    const { color } = this.props.computedFontConfig
    return color[c.toUpperCase()] || color['default'] || 'black';
  }

  // offscreenRatio = the proportion of the rendered view that is invisible, on each side. Total rendered area = visible area * (1 + 2 * offscreenRatio)^2
  getOffscreenRatio() { return 1 }

  getDimensions() {
    const { scrollLeft, scrollTop } = this.props
    const { clientWidth, clientHeight } = this.state
    const offscreenRatio = this.getOffscreenRatio()
    const offscreenWidth = offscreenRatio * clientWidth, offscreenHeight = offscreenRatio * clientHeight
    const top = Math.max (0, scrollTop - offscreenHeight),
          left = Math.max (0, scrollLeft - offscreenWidth),
          bottom = Math.min (this.props.treeLayout.treeHeight, scrollTop + clientHeight + offscreenHeight),
          right = Math.min (this.props.alignLayout.alignWidth, scrollLeft + clientWidth + offscreenWidth),
          width = right - left,
          height = bottom - top
    return { top, left, bottom, right, width, height }
  }
  
  setClientSize (clientWidth, clientHeight) {
    this.setState ({ clientWidth, clientHeight })
  }
  
  componentDidMount() {
    this.renderVisibleRegion()
  }
  
  componentDidUpdate() {
    this.renderVisibleRegion()
  }

  renderVisibleRegion() {
    if (this.lastRenderTime) {
      const currentTime = Date.now()
      const renderDelay = 10
      if (currentTime - this.lastRenderTime < renderDelay)
        return
      this.lastRenderTime = currentTime
    }
    const alignCanvas = this.canvasRef.current
    const ctx = alignCanvas.getContext('2d')
    const { top, left, bottom, right } = this.getDimensions()
    const { computedFontConfig, treeLayout, alignLayout, treeIndex, alignIndex, data } = this.props
    const { rowData } = data
    ctx.setTransform (1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.clearRect (0, 0, alignCanvas.width, alignCanvas.height)
    ctx.font = computedFontConfig.charFont
    let firstRow, lastRow  // firstRow is first (partially) visible row, lastRow is last (partially) visible row
    for (let row = firstRow = 0; row < treeLayout.rowHeight.length && treeLayout.rowY[row] < bottom; ++row) {
      if (treeLayout.rowY[row] < top)
        firstRow = row
      lastRow = row
    }
    let colX = 0
    for (let col = 0; col < alignIndex.columns && colX < right; ++col) {
      const xScale = alignLayout.computedColScale[col],
            colX = alignLayout.colX[col],
            width = alignLayout.colWidth[col]
      if (xScale && colX + width >= left)
        for (let row = firstRow; row <= lastRow; ++row) {
          const yScale = treeLayout.computedRowScale[row],
                rowY = treeLayout.rowY[row],
                height = treeLayout.rowHeight[row],
                seq = rowData[treeIndex.nodes[row]]
          if (height && seq) {
            ctx.globalAlpha = Math.min (xScale, yScale)
            const c = seq[col]
            if (typeof(c) === 'string') {
              ctx.setTransform (xScale, 0, 0, yScale, colX - left, rowY + height - top)
              ctx.fillStyle = this.getColor (c)
              ctx.fillText (c, 0, 0)
            } else {
              let psum = 0
              c.forEach ((cp) => {
                const ci = cp[0], p = cp[1]
                ctx.setTransform (xScale, 0, 0, yScale * p, colX - left, rowY + height*(1-psum) - top)
                ctx.fillStyle = this.getColor (ci)
                ctx.fillText (ci, 0, 0)
                psum += p
              })
            }
          }
        }
    }
  }
}

export default MSAAlignCanvas;
