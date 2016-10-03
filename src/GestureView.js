import Rx from 'rx'
import create from './create'
function yes () { return true }

import React, {
  PropTypes
} from 'react'
import {
  Animated,
  PanResponder
} from 'react-native'

export default class GestureView extends React.Component {
  static propTypes = {
    gestures: PropTypes.array.isRequired,
    style   : PropTypes.any,
    source  : PropTypes.any,
    type    : PropTypes.oneOf([
      'View',
      'Image'
    ]),

    toStyle        : PropTypes.func,
    onError        : PropTypes.func,
    onStart        : PropTypes.func,
    onMove         : PropTypes.func,
    onRelease      : PropTypes.func,
    gestureCallback: PropTypes.func,
    tapCallback    : PropTypes.func,
  };

  static defaultProps = {
    onError         : (_err         ) => {},
    onStart         : (_layout, _evt) => {},
    onMove          : (_layout, _evt) => {},
    onRelease       : (_layout, _evt) => {},
    gestureCallback : (_layout, _evt) => {},
    tapCallback     : (_layout, _evt) => {},
    toStyle         : (layout) => {
      const { width, height, x: left, y: top, rotate = 0 } = layout;
      return { top, left, width, height, transform: [{ rotate: `${rotate}deg` }] };
    },
    dragFilter : (evt) => evt.target === this.target,
  }

  getInitialLayout () {
    return this.layout
  }

  componentWillMount () {
    this.target      = null;
    this.layout      = null;
    this.evs         = ['onLayout'];
    this.gestureDefs = [];

    const { dragFilter } = this.props;

    this.getInitialLayout = this.getInitialLayout.bind(this);

    var streams = this.evs.reduce(function (res, eventName) {
      res[eventName] = new Rx.Subject();
      return res;
    }, {});

    Object.assign(this, streams, {__streams: streams})

    const onDragStart   = new Rx.Subject()
    const onDragMove    = new Rx.Subject()
    const onDragRelease = new Rx.Subject()

    this
      .onLayout
      .take(1)
      .subscribe(ev => this.target = ev.target);

    this
      .onLayout
      .subscribe(ev => this.layout = ev.layout);

    let draggable = {
      onDragStart  : onDragStart.filter(dragFilter),
      onDragMove   : onDragMove.filter(dragFilter),
      onDragRelease: onDragRelease.filter(dragFilter)
    }

    this.gestureResponder = PanResponder.create({
      onStartShouldSetPanResponder       : yes,
      onStartShouldSetPanResponderCapture: yes,
      onMoveShouldSetPanResponder        : yes,
      onMoveShouldSetPanResponderCapture : yes,
      onPanResponderGrant: (evt) => {
        this.props.onStart(this.layout, evt);
        onDragStart.onNext(evt.nativeEvent);
      },
      onPanResponderMove: (evt, gestureState) => {
        this.props.onMove(this.layout, evt)
        onDragMove.onNext(evt.nativeEvent)
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.moveX == 0 && gestureState.moveY == 0) {
          this.props.tapCallback(this.layout, evt)
        } else {
          this.props.onRelease(this.layout, evt)
          onDragRelease.onNext(evt.nativeEvent)
        }
      },
      onPanResponderTerminationRequest: yes,
      onPanResponderTerminate         : yes,
      onShouldBlockNativeResponder    : yes
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
        this.props.gestureCallback(layout);
        this.container.setNativeProps({
          style: this.props.toStyle(layout),
        });
      },
      (err) => this.props.onError(err)
    )
  }

  render () {
    let props = {
      ref   : (container) => this.container = container,
      style : this.props.style,
      type  : this.props.type || 'View',
      source: this.props.source,
      onLayout: (ev) => {
        this.onLayout.onNext(ev.nativeEvent)
      },
      ...this.gestureResponder.panHandlers
    }

    return (
      <Animated.View>
      {this.props.type === 'View' ? (
        <Animated.View {...props}>
          {this.props.children}
        </Animated.View>
      ) : (
        <Animated.Image {...props} />
      )}
      </Animated.View>
    )
  }
}
