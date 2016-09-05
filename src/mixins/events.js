import Rx from 'rx'
import React from 'react'
export default function events (Component, evs = []) {
  return React.createClass({
    componentWillMount () {
      var streams = evs.reduce(function (res, eventName) {
        res[eventName] = new Rx.Subject()
        return res
      }, {})

      Object.assign(this, streams, {__streams: streams})
    },
    componentWillUnmount () {
      evs.forEach((ev) => this.__streams[ev].onCompleted())
    },

    render () {
      return <Component {...this.props} />
    }
  })
}
