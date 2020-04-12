import React, { Component } from 'react'

class MSATree extends Component {
  constructor(props) {
    super(props)
    this.canvasRef = React.createRef()
  }

  render() {
    const { treeWidth } = this.props.computedTreeConfig
    const { treeHeight } = this.props.treeLayout
    return (
      <div className="MSA-tree" style={{ minWidth: treeWidth }}>
        <canvas
          className="MSA-tree-canvas"
          ref={this.canvasRef}
          width={treeWidth}
          height={treeHeight}
          style={{ top: -this.props.scrollTop }}
        />
      </div>
    )
  }

  componentDidMount() {
    this.renderTree()
    this.canvasRef.current.addEventListener(
      'click',
      this.handleClick.bind(this)
    )
  }

  componentWillUnmount() {
    this.canvasRef.current.removeEventListener(
      'click',
      this.handleClick.bind(this)
    )
  }

  componentDidUpdate() {
    this.renderTree()
  }

  renderTree() {
    const {
      treeIndex,
      treeLayout,
      computedView,
      computedTreeConfig,
    } = this.props
    const {
      collapsed,
      ancestorCollapsed,
      forceDisplayNode,
      nodeScale,
    } = computedView
    const {
      treeWidth,
      branchStrokeStyle,
      treeStrokeWidth,
      rowConnectorDash,
      nodeHandleRadius,
      nodeHandleFillStyle,
      collapsedNodeHandleFillStyle,
    } = computedTreeConfig
    const { nx, ny } = treeLayout
    const treeCanvas = this.canvasRef.current
    const ctx = treeCanvas.getContext('2d')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    ctx.clearRect(0, 0, treeCanvas.width, treeCanvas.height)
    ctx.strokeStyle = branchStrokeStyle
    ctx.fillStyle = branchStrokeStyle
    ctx.lineWidth = treeStrokeWidth
    const makeNodeHandlePath = (node) => {
      ctx.beginPath()
      ctx.arc(nx[node], ny[node], nodeHandleRadius, 0, 2 * Math.PI)
    }
    const setAlpha = (node) => {
      const scale = nodeScale[node]
      ctx.globalAlpha =
        typeof scale === 'undefined' || forceDisplayNode[node] ? 1 : scale
    }
    let nodesWithHandles = treeIndex.nodes.filter(
      (node) => !ancestorCollapsed[node] && treeIndex.children[node].length
    )
    treeIndex.nodes.forEach((node) => {
      if (!ancestorCollapsed[node]) {
        if (!treeIndex.children[node].length) {
          setAlpha(node)
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.fillRect(
            nx[node],
            ny[node] - nodeHandleRadius,
            1,
            2 * nodeHandleRadius
          )
        }
        if (treeIndex.children[node].length && !collapsed[node]) {
          ctx.setLineDash([])
          treeIndex.children[node].forEach((child) => {
            setAlpha(child)
            ctx.beginPath()
            ctx.moveTo(nx[node], ny[node])
            ctx.lineTo(nx[node], ny[child])
            ctx.lineTo(nx[child], ny[child])
            ctx.stroke()
          })
        }
        ctx.globalAlpha = 1
        if (treeIndex.children[node].length === 0 || forceDisplayNode[node]) {
          setAlpha(node)
          ctx.setLineDash(rowConnectorDash)
          ctx.beginPath()
          ctx.moveTo(nx[node], ny[node])
          ctx.lineTo(treeWidth, ny[node])
          ctx.stroke()
        }
      }
    })
    ctx.strokeStyle = branchStrokeStyle
    ctx.setLineDash([])
    nodesWithHandles.forEach((node) => {
      setAlpha(node)
      makeNodeHandlePath(node)
      // hack: collapsed[node]===false (vs undefined) means that we are animating the open->collapsed transition
      // so the node's descendants are visible, but the node itself is rendered as collapsed
      if (
        collapsed[node] ||
        (forceDisplayNode[node] && collapsed[node] !== false)
      )
        ctx.fillStyle = collapsedNodeHandleFillStyle
      else {
        ctx.fillStyle = nodeHandleFillStyle
        ctx.stroke()
      }
      ctx.fill()
    })
    this.nodesWithHandles = nodesWithHandles
  }

  handleClick(evt) {
    evt.preventDefault()
    const { treeLayout } = this.props
    const mouseX = parseInt(evt.offsetX)
    const mouseY = parseInt(evt.offsetY)
    let closestNode, closestNodeDistSquared
    this.nodesWithHandles.forEach((node) => {
      const distSquared =
        Math.pow(mouseX - treeLayout.nx[node], 2) +
        Math.pow(mouseY - treeLayout.ny[node], 2)
      if (
        typeof closestNodeDistSquared === 'undefined' ||
        distSquared < closestNodeDistSquared
      ) {
        closestNodeDistSquared = distSquared
        closestNode = node
      }
    })
    if (
      closestNode &&
      closestNodeDistSquared <=
        Math.pow(this.props.config.nodeHandleClickRadius, 2)
    )
      this.props.handleNodeClick(closestNode)
  }
}

export default MSATree
