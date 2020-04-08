import React, { Component } from 'react';
import { extend } from 'lodash';

class MSAAlign extends Component {
  
  constructor(props) {
    super(props);
    this.state = extend ({}, props)
    this.canvasRef = React.createRef()
  }

  render() {
    return (<canvas
            className="MSA-alignment-canvas"
            ref={this.canvasRef}
            />)
  }

  componentDidMount() {
    const alignCanvas = this.canvasRef.current
    // render alignment...
  }
}

export default MSAAlign;
