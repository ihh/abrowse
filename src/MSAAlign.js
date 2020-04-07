import React, { Component } from 'react';
import { extend } from 'lodash';

import MSAAlignCanvas from './MSAAlignCanvas';

class MSAAlign extends Component {
  
  constructor(props) {
    super(props);
    this.state = extend ({}, props)
  }

  render() {
    const { data, computedFontConfig, alignLayout, treeLayout, treeIndex, alignIndex, computedView, config, view } = this.state
    const { rowData } = data
    const structure = data.structure || {}, structureState = view.structure, structureConfig = config.structure || {}
    const { nameDivWidth } = config
    const { nodeHeight, treeHeight } = treeLayout
    const { alignWidth } = alignLayout
    const { nameFont, nameFontSize, nameFontColor, charFont, charFontName, genericRowHeight } = computedFontConfig
    return (<div className="MSA-alignment">
            <div className="MSA-alignment-names"
            style={{ fontSize: nameFontSize + 'px',
                     maxWidth: nameDivWidth }}>
            
            </div>
            <div className="MSA-alignment-rows">
            <MSAAlignCanvas/>
            <div className="MSA-alignment-rows-back"
            style={{ width: alignWidth,
                     height: treeHeight }} />
            </div>
            </div>)
  }
}

export default MSAAlign;
