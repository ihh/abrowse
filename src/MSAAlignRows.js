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
    
    return (<div className="MSA-alignment-rows">
            <MSAAlignCanvas/>
            <div className="MSA-alignment-rows-back"
            style={{ width: alignWidth,
                     height: treeHeight }} />
            </div>)
  }
}

export default MSAAlignRows;
