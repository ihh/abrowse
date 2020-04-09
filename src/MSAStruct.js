import React, { Component } from 'react';
import { extend } from 'lodash';
import pv from 'bio-pv';

class MSAStruct extends Component {

  constructor(props) {
    super(props);

    this.pvDivRef = React.createRef()
  }

  render() {
    console.warn(this.props)
    return (<div
            className="MSA-structure"
            style={{width: this.props.config.structure.width,
                    height: this.props.config.structure.height}}
            >
            <div className="MSA-structure-label">
            {this.props.structure.node}
            </div>
            <div className="MSA-structure-close-button">
            <button onClick={this.handleClose.bind(this)}>
            x</button>
            </div>
            <div
            className="MSA-structure-pv"
            ref={this.pvDivRef}
            />
            </div>)
  }

  getPvConfig (structureConfig) {
    const { width, height } = structureConfig
    return (structureConfig.pvConfig
            || { width,
                 height,
                 antialias: true,
                 quality : 'medium' })
  }

  pdbUrlPrefix() { return 'https://files.rcsb.org/download/' }
  pdbUrlSuffix() { return '.pdb' }
  
  componentDidMount() {
    const structureConfig = this.props.config.structure
    const pvConfig = this.getPvConfig (structureConfig)
    const viewer = pv.Viewer (this.pvDivRef.current, pvConfig)
    const loadFromPDB = !structureConfig.noRemoteStructures
    const pdbFilePath = ((loadFromPDB
                          ? this.pdbUrlPrefix()
                          : (structureConfig.pdbFilePrefix || ''))
                         + this.props.structure.structureInfo.pdbFile
                         + (loadFromPDB
                            ? this.pdbUrlSuffix()
                            : (structureConfig.pdbFileSuffix || '')))
    pv.io.fetchPdb (pdbFilePath, (pdb) => {
      // display the protein as cartoon, coloring the secondary structure
      // elements in a rainbow gradient.
      viewer.cartoon('protein', pdb, { color : pv.color.ssSuccession() })
      viewer.centerOn(pdb)
      viewer.autoZoom()
      extend (this.props.structure, { pdb, viewer })
    })
  }

  handleClose (evt) {
    evt.preventDefault();
    this.props.handleCloseStructure (this.props.structure)
  }
}

export default MSAStruct;
