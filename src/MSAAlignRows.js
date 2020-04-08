import React, { Component } from 'react';

import MSAAlignCanvas from './MSAAlignCanvas';

class MSAAlignRows extends Component {
  
  constructor(props) {
    super(props);
    this.rowsDivRef = React.createRef()
  }

  render() {
    const { treeHeight } = this.props.treeLayout
    const { alignWidth } = this.props.alignLayout

    return (<div className="MSA-alignment-rows"
            ref={this.rowsDivRef}
            onScroll={this.onScroll.bind(this)}
            onMouseDown={this.onMouseDown.bind(this)}>
            <MSAAlignCanvas/>
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
    this.props.setClientHeight (this.rowsDivRef.current.clientHeight)
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
