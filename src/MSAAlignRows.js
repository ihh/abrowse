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
            onScroll={this.onScroll.bind(this)}
            onMouseDown={this.onMouseDown.bind(this)}>

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

            <div className="MSA-alignment-rows-back"
            style={{ width: alignWidth,
                     height: treeHeight }} />

            </div>)
  }

  componentDidUpdate() {
    this.setScrollPos()
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

  onMouseDown (evt) {
    this.props.handleMouseDown (evt)
  }

  onClick (evt) {
    this.props.handleClick (evt)
  }

  onScroll (evt) {
    this.props.handleScroll (this.rowsDivRef.current.scrollLeft,
                             this.rowsDivRef.current.scrollTop)
  }
}

export default MSAAlignRows;
