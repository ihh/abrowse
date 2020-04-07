import React, { Component } from 'react';
import { extend } from 'lodash';

class MSATree extends Component {
  
  constructor(props) {
    super(props);
    this.state = extend ({}, props)
    this.canvasRef = React.createRef()
  }

  render() {
    return (<div className="MSA-tree">
            <canvas
            ref={this.canvasRef}
            width={this.state.computedTreeConfig.treeWidth}
            height={this.state.treeLayout.treeHeight}
            />
            </div>)
  }

  componentDidMount() {
    const { treeIndex, treeLayout, computedView, computedTreeConfig } = this.state
    const { collapsed, ancestorCollapsed, forceDisplayNode, nodeScale } = computedView
    const { treeWidth, branchStrokeStyle, treeStrokeWidth, rowConnectorDash, nodeHandleRadius, nodeHandleFillStyle, collapsedNodeHandleFillStyle } = computedTreeConfig
    const { nx, ny } = treeLayout
    const treeCanvas = this.canvasRef.current
    const ctx = treeCanvas.getContext('2d')
    ctx.strokeStyle = branchStrokeStyle
    ctx.lineWidth = treeStrokeWidth
    const makeNodeHandlePath = (node) => {
      ctx.beginPath()
      ctx.arc (nx[node], ny[node], nodeHandleRadius, 0, 2*Math.PI)
    }
    const setAlpha = (node) => {
      const scale = nodeScale[node]
      ctx.globalAlpha = (typeof(scale) === 'undefined' || forceDisplayNode[node]) ? 1 : scale
    }
    let nodesWithHandles = treeIndex.nodes.filter ((node) => !ancestorCollapsed[node] && treeIndex.children[node].length)
    treeIndex.nodes.forEach ((node) => {
      if (!ancestorCollapsed[node]) {
        if (!treeIndex.children[node].length) {
          setAlpha (node)
          ctx.setLineDash ([])
          ctx.beginPath()
          ctx.fillRect (nx[node], ny[node] - nodeHandleRadius, 1, 2*nodeHandleRadius)
        }
        if (treeIndex.children[node].length && !collapsed[node]) {
          ctx.setLineDash ([])
          treeIndex.children[node].forEach ((child) => {
            setAlpha (child)
            ctx.beginPath()
            ctx.moveTo (nx[node], ny[node])
            ctx.lineTo (nx[node], ny[child])
            ctx.lineTo (nx[child], ny[child])
            ctx.stroke()
          })
        }
        ctx.globalAlpha = 1
        if (treeIndex.children[node].length === 0 || forceDisplayNode[node]) {
          setAlpha (node)
          ctx.setLineDash (rowConnectorDash)
          ctx.beginPath()
          ctx.moveTo (nx[node], ny[node])
          ctx.lineTo (treeWidth, ny[node])
          ctx.stroke()
        }
      }
    })
    ctx.strokeStyle = branchStrokeStyle
    ctx.setLineDash ([])
    nodesWithHandles.forEach ((node) => {
      setAlpha (node)
      makeNodeHandlePath (node)
      // hack: collapsed[node]===false (vs undefined) means that we are animating the open->collapsed transition
      // so the node's descendants are visible, but the node itself is rendered as collapsed
      if (collapsed[node] || (forceDisplayNode[node] && collapsed[node] !== false))
        ctx.fillStyle = collapsedNodeHandleFillStyle
      else {
        ctx.fillStyle = nodeHandleFillStyle
        ctx.stroke()
      }
      ctx.fill()
    })
  }  
}

export default MSATree;
