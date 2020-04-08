import React, { Component } from 'react';
import { extend } from 'lodash';

class MSAAlign extends Component {
  
  constructor(props) {
    super(props);
    this.state = { clientWidth: 0,
                   clientHeight: 0}
    this.canvasRef = React.createRef()
  }

  render() {
    return (<canvas
            className="MSA-alignment-canvas"
            width={this.state.clientWidth}
            height={this.state.clientHeight}
            ref={this.canvasRef}
            />)
  }

  setClientSize (clientWidth, clientHeight) {
    this.setState ({ clientWidth, clientHeight })
  }
  
  componentDidMount() {
    const alignCanvas = this.canvasRef.current
    // render alignment...
  }
}

export default MSAAlign;
