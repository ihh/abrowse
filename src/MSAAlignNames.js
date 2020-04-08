import React, { Component } from 'react';
import { extend } from 'lodash';

class MSAAlignNames extends Component {
  
  constructor(props) {
    super(props);
    this.state = extend ({}, props)
  }

  render() {
    const { computedFontConfig, treeIndex, config, computedView, treeLayout } = this.state
    const { nameDivWidth } = config
    const { nameFontName, nameFontSize } = computedFontConfig

    const { nodeHeight } = treeLayout
    
    return (<div className="MSA-alignment-names"
            style={{ fontFamily: nameFontName,
                     fontSize: nameFontSize + 'px',
                     maxWidth: nameDivWidth,
                     top: -this.state.scrollTop }}>
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
