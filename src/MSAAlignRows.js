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
            />
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
  
  setScrollPos() {
    this.rowsDivRef.current.scrollLeft = this.props.scrollLeft
    this.rowsDivRef.current.scrollTop = this.props.scrollTop
  }

  onScroll (evt) {
    this.props.handleAlignmentScroll (this.rowsDivRef.current.scrollLeft,
                                      this.rowsDivRef.current.scrollTop)
  }

  onMouseDown (evt) {
    this.props.handleMouseDown (evt)
  }
}

export default MSAAlignRows;
