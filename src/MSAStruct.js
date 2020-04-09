import React, { Component } from 'react';
import Select from 'react-select';
import { isArray } from 'lodash';
import pv from 'bio-pv';

class MSAStruct extends Component {

  constructor(props) {
    super(props);

    this.pvDivRef = React.createRef()
  }

  render() {
    return (<div
            className="MSA-structure"
            style={{width: this.props.config.structure.width,
                    height: this.props.config.structure.height}}
            >

            <div className="MSA-structure-top">
            <div className="MSA-structure-label">
            {this.props.structure.node}
            </div>
            <div className="MSA-structure-close-button">
            <button onClick={this.handleClose.bind(this)}>
            X</button>
            </div>
            </div>
            
            <div className="MSA-structure-main">
            { isArray(this.props.structure.structureInfo)
              && (<Select
                  options={this.props.structure.structureInfo.map ((info) => { return { value: info, label: info.pdbFile } })}
                  placeholder="Select a structure"
                  onChange={this.handleSelectStructure.bind(this)}
                  />) }
            <div
            className="MSA-structure-pv"
            ref={this.pvDivRef}
            />
            </div>
            
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
    if (!isArray (this.props.structure.structureInfo))
      this.loadStructure()
  }

  componentDidUpdate() {
    if (!isArray (this.props.structure.structureInfo))
      this.loadStructure()
  }

  handleSelectStructure (selection) {
    this.props.updateStructure ({ structureInfo: selection.value })
  }
  
  loadStructure() {
    if (!this.props.structure.pdbFetchInitiated) {
      this.props.updateStructure ({ pdbFetchInitiated: true })
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
        this.props.updateStructure ({ pdb, viewer })
      })
    }
  }

  handleClose (evt) {
    evt.preventDefault();
    this.props.handleCloseStructure (this.props.structure)
  }
}

export default MSAStruct;
