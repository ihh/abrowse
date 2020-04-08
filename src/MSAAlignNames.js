import React, { Component } from 'react';
import { extend } from 'lodash';

class MSAAlignNames extends Component {
  
  constructor(props) {
    super(props);
    this.state = extend ({}, props)
  }

  render() {
    const { data, computedFontConfig, treeIndex, alignIndex, config, view, computedView, treeLayout, alignLayout } = this.state
    const { nameDivWidth } = config
    const { nameFontName, nameFontSize, nameFontColor, charFont, charFontName, genericRowHeight } = computedFontConfig

    const { treeHeight, nodeHeight } = treeLayout
    const { alignWidth } = alignLayout
    
    return (<div className="MSA-alignment-names"
            style={{ fontFamily: nameFontName,
                     fontSize: nameFontSize + 'px',
                     maxWidth: nameDivWidth }}>
            { treeIndex.nodes
              .filter ((node) => computedView.nodeVisible[node])
              .map ((node, row) => {
                return (<div className="MSA-alignment-name"
                        key={node}
                        style={{ height: nodeHeight[node] + 'px' }}>
                        <span>
                        { node }
                        </span>
                        </div>)
              }) }
            </div>)
  }

}

export default MSAAlignNames;
