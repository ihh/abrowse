import React, { Component } from 'react';
import { Select, MenuItem } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { isArray } from 'lodash';
import pv from 'bio-pv';

class MSAStruct extends Component {

  constructor(props) {
    super(props);
    this.pvDivRef = React.createRef()
  }

  render() {
    const wantStructure = isArray(this.props.structure.structureInfo)
    const structureID = !wantStructure && this.props.structure.structureInfo.pdbFile
    return (<div
            className="MSA-structure"
            style={{width: this.props.config.structure.width,
                    height: this.props.config.structure.height}}
            >

            <div className="MSA-structure-name">
            {this.props.structure.node}
            </div>

            { structureID
              && (<div className="MSA-structure-label">
                  {structureID}
                  </div>) }

            <div className="MSA-structure-top">
            { wantStructure
              && (<Select
                  value=''
                  displayEmpty
                  onChange={this.handleSelectStructure.bind(this)}
                  >
                  <MenuItem value='' disabled>
                  Select a structure
                  </MenuItem>
                  {this.props.structure.structureInfo.map ((info, n) => (<MenuItem key={n} value={info}>{info.pdbFile}</MenuItem>))}
                  </Select>
                 ) }
            <div className="MSA-structure-close-button">
            <CloseIcon onClick={this.handleClose.bind(this)}/>
            </div>
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
    if (!isArray (this.props.structure.structureInfo))
      this.loadStructure()
  }

  componentDidUpdate() {
    if (!isArray (this.props.structure.structureInfo))
      this.loadStructure()
  }

  handleSelectStructure (selection) {
    this.props.updateStructure ({ structureInfo: selection.target.value })
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
