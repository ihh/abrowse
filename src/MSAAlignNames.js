import React, { Component } from 'react';

class MSAAlignNames extends Component {
  
  constructor(props) {
    super(props);
  }

  render() {
    const { computedFontConfig, treeIndex, config, computedView, treeLayout } = this.props
    const { nameDivWidth } = config
    const { nameFontName, nameFontSize } = computedFontConfig

    const { nodeHeight } = treeLayout
    
    return (<div className="MSA-alignment-names"
            style={{ fontFamily: nameFontName,
                     fontSize: nameFontSize + 'px',
                     maxWidth: nameDivWidth }}>
            <div className="MSA-alignment-names-content"
            style={{ top: -this.props.scrollTop }}>
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
            </div>
            </div>)
  }

}

export default MSAAlignNames;
