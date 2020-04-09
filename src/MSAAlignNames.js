import React, { Component } from 'react';

class MSAAlignNames extends Component {

  render() {
    const { data, computedFontConfig, treeIndex, config, computedView, treeLayout } = this.props
    const structure = data.structure || {}
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
                const style = { height: nodeHeight[node] + 'px' }
                const scale = this.props.view.nodeScale[node]
                if (typeof(scale) !== 'undefined' && scale !== 1) {
                  style.transform = 'scale(1,' + scale +')'
                  style.opacity = scale
                }
                return (<div className="MSA-alignment-name"
                        key={node}
                        style={style}>
                        <span>
                        { structure[node]
                          ? (<button onClick={()=>this.props.handleNameClick(node)}> { node } </button>)
                          : node }
                        </span>
                        </div>)
              }) }
            </div>
            </div>)
  }

}

export default MSAAlignNames;
