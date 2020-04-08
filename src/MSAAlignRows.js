import React, { Component } from 'react';
import { extend } from 'lodash';

import MSAAlignCanvas from './MSAAlignCanvas';

class MSAAlignRows extends Component {
  
  constructor(props) {
    super(props);
    this.state = extend ({}, props)
    this.rowsDivRef = React.createRef()
  }

  render() {
    const { treeHeight } = this.state.treeLayout
    const { alignWidth } = this.state.alignLayout

    console.warn(this.state)
    
    return (<div className="MSA-alignment-rows"
            ref={this.rowsDivRef}
            onScroll={this.onScroll.bind(this)}>
            <MSAAlignCanvas/>
            <div className="MSA-alignment-rows-back"
            style={{ width: alignWidth,
                     height: treeHeight }} />
            </div>)
  }

  componentDidUpdate() { this.setScrollPos() }
  componentDidMount() { this.setScrollPos() }
  
  setScrollPos() {
    this.rowsDivRef.current.scrollLeft = this.state.scrollLeft
    this.rowsDivRef.current.scrollTop = this.state.scrollTop
  }

  onScroll() {
    this.props.handleAlignmentScroll (this.rowsDivRef.current.scrollLeft,
                                      this.rowsDivRef.current.scrollTop)
  }
}

export default MSAAlignRows;
