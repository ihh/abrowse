import React, { Component } from 'react';

import MSAAlignCanvas from './MSAAlignCanvas';

class MSAAlignRows extends Component {
  
  constructor(props) {
    super(props);
    this.rowsDivRef = React.createRef()
    this.alignCanvasRef = React.createRef()
  }

  render() {
    const { treeHeight } = this.props.treeLayout
    const { alignWidth } = this.props.alignLayout

    return (<div className="MSA-alignment-rows"
            ref={this.rowsDivRef}
            onClick={this.handleClick.bind(this)}
            onMouseMove={this.handleMouseMove.bind(this)}
            onMouseLeave={this.handleMouseLeave.bind(this)}
            onMouseDown={this.handleMouseDown.bind(this)}
            onScroll={this.handleScroll.bind(this)}>

            <MSAAlignCanvas
            ref={this.alignCanvasRef}
            data={this.props.data}
            treeIndex={this.props.treeIndex}
            alignIndex={this.props.alignIndex}
            treeLayout={this.props.treeLayout}
            alignLayout={this.props.alignLayout}
            computedFontConfig={this.props.computedFontConfig}
            scrollLeft={this.props.scrollLeft}
            scrollTop={this.props.scrollTop}
            />

            {this.props.hoverColumn !== null
             ? (<div className="MSA-alignment-column-cursor"
                style={{ left: this.props.alignLayout.colX[this.props.hoverColumn],
                         top: 0,
                         width: this.props.alignLayout.colWidth[this.props.hoverColumn],
                         height: this.props.treeLayout.treeHeight }}/>)
             : ''}

            <div className="MSA-alignment-rows-back"
            style={{ width: alignWidth,
                     height: treeHeight }} />

            </div>)
  }

  componentDidUpdate() {
    this.setScrollPos()
    this.setClientSize()
  }
  
  componentDidMount() {
    this.setScrollPos()
    this.setClientSize()
    window.addEventListener ('resize', this.setClientSize.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener ('resize', this.setClientSize.bind(this))
  }

  setClientSize() {
    this.props.setClientSize (this.rowsDivRef.current.clientWidth,
                              this.rowsDivRef.current.clientHeight)
    this.alignCanvasRef.current.setClientSize (this.rowsDivRef.current.clientWidth,
                                               this.rowsDivRef.current.clientHeight)
  }
  
  setScrollPos (opts) {
    opts = opts || this.props
    this.rowsDivRef.current.scrollLeft = opts.scrollLeft
    this.rowsDivRef.current.scrollTop = opts.scrollTop
  }

  handleClick (evt) {
    this.props.handleAlignCharClick (this.resolveAlignCoords (evt))
  }

  handleMouseMove (evt) {
    const coords = this.resolveAlignCoords (evt)
    if (!this.lastCoords || coords.row !== this.lastCoords.row || coords.column !== this.lastCoords.column) {
      this.props.handleAlignCharMouseOut (this.lastCoords)
      this.props.handleAlignCharMouseOver (coords)
      this.lastCoords = coords
    }
  }

  handleMouseLeave (evt) {
    this.props.handleMouseLeave (evt)
  }

  handleMouseDown (evt) {
    this.props.handleMouseDown (evt)
  }

  handleScroll (evt) {
    this.props.handleScroll (this.rowsDivRef.current.scrollLeft,
                             this.rowsDivRef.current.scrollTop)
  }

  resolveAlignCoords (evt) {
    const { treeIndex, alignIndex, treeLayout, alignLayout, data } = this.props
    const { rowData } = data
    const x = parseInt (evt.nativeEvent.offsetX),
          y = parseInt (evt.nativeEvent.offsetY)
    let row, column
    for (row = 0; row < treeIndex.nodes.length - 1; ++row)
      if (treeLayout.rowY[row] <= y && treeLayout.rowY[row] + treeLayout.rowHeight[row] > y)
        break
    for (column = 0; column < alignIndex.columns - 1; ++column)
      if (alignLayout.colX[column] <= x && alignLayout.colX[column] + alignLayout.colWidth[column] > x)
        break
    const node = treeIndex.nodes[row],
          colToSeqPos = alignIndex.alignColToSeqPos[node],
          seqPos = colToSeqPos && colToSeqPos[column],
          seq = rowData[node],
          c = seq && seq[column],
          isGap = this.props.isGapChar(c)
    return { row, column, node, seqPos, c, isGap }
  }
}

export default MSAAlignRows;
