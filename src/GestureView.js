import Rx from 'rx'
import create from './create'
function yes () { return true }

import React, {
  PropTypes
} from 'react'
import {
  Animated,
  Image,
  PanResponder
} from 'react-native'

export default class GestureView extends React.Component {
  static propTypes = {
    gestures: PropTypes.array.isRequired,
    onError: PropTypes.func.isRequired,
    toStyle: PropTypes.func.isRequired,
    style: PropTypes.any,

    type: PropTypes.oneOf([
      'View',
      'Image'
    ]),
    source: PropTypes.any
  }

  getInitialLayout () {
    return this.layout
  }

  isCurrentTarget (ev) {
    return ev.target === this.target
  }

  componentWillMount () {
    this.target = null
    this.layout = null
    this.evs = ['onLayout']
    this.gestureDefs = []

    this.getInitialLayout = this.getInitialLayout.bind(this)
    this.isCurrentTarget = this.isCurrentTarget.bind(this)

    var streams = this.evs.reduce(function (res, eventName) {
      res[eventName] = new Rx.Subject()
      return res
    }, {})

    Object.assign(this, streams, {__streams: streams})

    let onDragStart = new Rx.Subject()
    let onDragMove = new Rx.Subject()
    let onDragRelease = new Rx.Subject()

    this
      .onLayout
      .take(1)
      .subscribe(ev => this.target = ev.target)

    this
      .onLayout
      .subscribe(ev => this.layout = ev.layout)

    let draggable = {
      onDragStart: onDragStart.filter(this.isCurrentTarget),
      onDragMove: onDragMove.filter(this.isCurrentTarget),
      onDragRelease: onDragRelease.filter(this.isCurrentTarget)
    }

    this.gestureResponder = PanResponder.create({
      onStartShouldSetPanResponder: yes,
      onStartShouldSetPanResponderCapture: yes,
      onMoveShouldSetPanResponder: yes,
      onMoveShouldSetPanResponderCapture: yes,
      onPanResponderGrant: (evt) => onDragStart.onNext(evt.nativeEvent),
      onPanResponderMove: (evt, gestureState) => {
        this.props.onMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY)
        onDragMove.onNext(evt.nativeEvent)
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.moveX == 0 && gestureState.moveY == 0) {
          this.props.tapCallback()
        } else {
          this.props.onRelease(evt.nativeEvent.pageX, evt.nativeEvent.pageY)
          onDragRelease.onNext(evt.nativeEvent)
        }
      },
      onPanResponderTerminationRequest: yes,
      onPanResponderMove: (evt, gestureState) => {
        this.props.onMove(evt.nativeEvent.pageX, evt.nativeEvent.pageY)
        onDragMove.onNext(evt.nativeEvent)
      },
      onPanResponderTerminate: yes,
      onShouldBlockNativeResponder: yes
    })

    if (this.props && this.props.gestures) {
      this.gestureDefs = this.gestureDefs.concat(this.props.gestures)
    }

    this.layoutStream = Rx
      .Observable
      .merge(this.gestureDefs.map(def =>
        create(def.responder, def.transducer, this.getInitialLayout, draggable)))
  }

  componentWillUnmount () {
    this.evs.forEach((ev) => this.__streams[ev].onCompleted())
  }

  componentDidMount () {
    this.layoutStream.subscribe(
      (layout) => {
        // this.props.gestureCallback(layout)
        this.container.setNativeProps({
          style: this.props.toStyle(layout)
        })
      },
      (err) => this.props.onError(err)
    )
  }

  render () {
    let props = {
      ref: (container) => this.container = container,
      style: this.props.style,
      onLayout: ({nativeEvent}) => {
        this.onLayout.onNext(nativeEvent)
      },
      type: this.props.type || 'View',
      source: this.props.source,
      ...this.gestureResponder.panHandlers
    }

    return (
      <Animated.View {...props}>
        {this.props.children}
      </Animated.View>
    )
  }
}
