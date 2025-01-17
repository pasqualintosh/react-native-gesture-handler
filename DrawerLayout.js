/* Object.defineProperty(exports, "__esModule", { value: true });exports.default = undefined;var _extends = Object.assign || function (target) {for (var i = 1; i < arguments.length; i++) {var source = arguments[i];for (var key in source) {if (Object.prototype.hasOwnProperty.call(source, key)) {target[key] = source[key];}}}return target;};var _createClass = function () {function defineProperties(target, props) {for (var i = 0; i < props.length; i++) {var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);}}return function (Constructor, protoProps, staticProps) {if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;};}();var _class, _temp;
var _react = require('react');var _react2 = _interopRequireDefault(_react);
var _reactNativeDismissKeyboard = require('react-native-dismiss-keyboard');var _reactNativeDismissKeyboard2 = _interopRequireDefault(_reactNativeDismissKeyboard);
var _reactNative = require('react-native');function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}function _classCallCheck(instance, Constructor) {if (!(instance instanceof Constructor)) {throw new TypeError("Cannot call a class as a function");}}function _possibleConstructorReturn(self, call) {if (!self) {throw new ReferenceError("this hasn't been initialised - super() hasn't been called");}return call && (typeof call === "object" || typeof call === "function") ? call : self;}function _inherits(subClass, superClass) {if (typeof superClass !== "function" && superClass !== null) {throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;}









var MIN_SWIPE_DISTANCE = 3;
var DEVICE_WIDTH = parseFloat(_reactNative.Dimensions.get('window').width);
var THRESHOLD = DEVICE_WIDTH / 2;
var VX_MAX = 0.1;

var IDLE = 'Idle';
var DRAGGING = 'Dragging';
var SETTLING = 'Settling';var
 */
// @flow
import React, { Component } from 'react';
import {
  Animated,
  Dimensions,
  Keyboard,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  I18nManager,
} from 'react-native';
import LinearGradient from "react-native-linear-gradient";

const MIN_SWIPE_DISTANCE = 3;
const DEVICE_WIDTH = parseFloat(Dimensions.get('window').width);
const THRESHOLD = DEVICE_WIDTH / 2;
const VX_MAX = 0.1;

const IDLE = 'Idle';
const DRAGGING = 'Dragging';
const SETTLING = 'Settling';

export type PropType = {
  children: any,
  //comment: this is my new props
  drawerType?: 'overlay' | 'push-screen' | 'responsive',
  drawerResponsiveWidth?: number,
  drawerBackgroundColor?: string,
  drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open',
  drawerPosition: 'left' | 'right',
  drawerWidth: number,
  keyboardDismissMode?: 'none' | 'on-drag',
  onDrawerClose?: Function,
  onDrawerOpen?: Function,
  onDrawerSlide?: Function,
  onDrawerStateChanged?: Function,
  renderNavigationView: () => any,
  statusBarBackgroundColor?: string,
  useNativeAnimations?: boolean,
};

export type StateType = {
  accessibilityViewIsModal: boolean,
  drawerShown: boolean,
  openValue: any,
  isWide: boolean,
};

export type EventType = {
  stopPropagation: Function,
};

export type PanResponderEventType = {
  dx: number,
  dy: number,
  moveX: number,
  moveY: number,
  vx: number,
  vy: number,
};

export type DrawerMovementOptionType = {
  velocity?: number,
};

export default class DrawerLayout extends Component {
  props: PropType;
  state: StateType;
  _lastOpenValue: number;
  _panResponder: any;
  _isClosing: boolean;
  _closingAnchorValue: number;

  static defaultProps = {
    drawerWidth: 0,
    drawerPosition: 'left',
    useNativeAnimations: false,
  };

  static positions = {
    Left: 'left',
    Right: 'right',
  };

  constructor(props: PropType, context: any) {
    super(props, context);
    const isWide = Dimensions.get('window').width > props.drawerResponsiveWidth;
    const responsive = props.drawerType === 'responsive';
    this.state = {
      accessibilityViewIsModal: isWide && responsive,
      drawerShown: isWide && responsive,
      openValue: new Animated.Value(isWide && responsive ? 1 : 0),
      isWide,
    };
  }

  getDrawerPosition() {
    const { drawerPosition } = this.props;
    const rtl = I18nManager.isRTL;
    return rtl
      ? drawerPosition === 'left' ? 'right' : 'left' // invert it
      : drawerPosition;
  }

  componentWillMount() {
    const { openValue } = this.state;

    openValue.addListener(({ value }) => {
      const drawerShown = value > 0;
      const accessibilityViewIsModal = drawerShown;
      if (drawerShown !== this.state.drawerShown) {
        this.setState({ drawerShown, accessibilityViewIsModal });
      }

      if (this.props.keyboardDismissMode === 'on-drag') {
        Keyboard.dismiss();
      }

      this._lastOpenValue = value;
      if (this.props.onDrawerSlide) {
        this.props.onDrawerSlide({ nativeEvent: { offset: value } });
      }
    });

    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: this._shouldSetPanResponder,
      onPanResponderGrant: this._panResponderGrant,
      onPanResponderMove: this._panResponderMove,
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: this._panResponderRelease,
      onPanResponderTerminate: () => { },
    });

    Dimensions.addEventListener('change', () => {
      const { drawerResponsiveWidth, drawerType } = this.props;
      const isWide = Dimensions.get('window').width > drawerResponsiveWidth;
      const responsive = drawerType === 'responsive';
      this.setState(() => ({
        isWide,
      }));
    });
  }

  componentDidUpdate(prevProps: PropType, prevState: StateType) {
    const { drawerType } = this.props;
    // We only deal with the responsive mode here
    if (drawerType === 'responsive') {
      const { isWide: wasWide, drawerShown: wasShown } = prevState;
      const { isWide } = this.state;
      const nowWide = !wasWide && isWide;
      const nowNotWide = wasWide && !isWide;
      // if the screen is now wide enough to dock
      // open the drawer without onDrawerOpen callback
      if (nowWide && !wasShown) {
        this._openDrawer();
        return;
      }
      // if the screen is now wide enough to dock but was already open
      // step 1: close the drawer with all callbacks fired
      if (nowWide && wasShown) {
        this.closeDrawer();
        return;
      }
      // step 2: open again in the next state cycle without onDrawerOpen callback
      if (isWide && !wasShown) {
        this._openDrawer();
        return;
      }
      // if the screen went
      // close the drawer with all callbacks fired
      if (nowNotWide && wasShown) {
        this.closeDrawer();
        return;
      }
    }
  }

  render() {
    const {
      accessibilityViewIsModal,
      drawerShown,
      openValue,
      isWide,
    } = this.state;

    const {
      drawerBackgroundColor,
      drawerWidth,
      drawerPosition,
      //comment: here I get its value (pretty obvious)
      drawerType,
    } = this.props;

    // if drawerType === responsive AND isWide
    // - show the drawer by default
    // TODO override drawerLockMode = locked-open
    // - squish the content (flex display)
    // if drawerType === responsive AND NOT isWide
    // OR drawerType === push-screen
    // - hide the drawer by default
    // ? restore drawerLockMode
    // - push content on openDrawer (transform: translateX)

    const overlay = drawerType === 'overlay';
    const responsive = drawerType === 'responsive';
    const squish = responsive && isWide;
    const push = drawerType === 'push-screen' || (responsive && !isWide);

    const left = drawerPosition === 'left';
    const right = drawerPosition === 'right';
    /**
     * We need to use the "original" drawer position here
     * as RTL turns position left and right on its own
     **/
    const dynamicDrawerStyles = {
      backgroundColor: drawerBackgroundColor,
      width: drawerWidth,
      left: left ? 0 : null,
      right: right ? 0 : null,
    };

    /* Drawer styles */
    let outputRange;
    let mainViewPosition;

    if (this.getDrawerPosition() === 'left') {
      outputRange = [-drawerWidth, 0];
      mainViewPosition = [0, drawerWidth];
    } else {
      outputRange = [drawerWidth, 0];
      mainViewPosition = [0, -drawerWidth];
    }

    const drawerTranslateX = openValue.interpolate({
      inputRange: [0, 1],
      outputRange,
      extrapolate: 'clamp',
    });
    const mainViewTranslateX = openValue.interpolate({
      inputRange: [0, 1],
      outputRange: mainViewPosition,
      extrapolate: 'clamp',
    });

    const scaleX = openValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.9],
      extrapolate: 'clamp',
    });
    const animatedDrawerStyles = {
      transform: [{ translateX: drawerTranslateX }],
    };
    //comment: main magic "subscribe" to drawer's movement
    const animatedMainStyles = {
      transform: [{ translateX: mainViewTranslateX }, { scaleY: scaleX }],
    };
    // scaleX: scaleX
    /* Overlay styles */
    const overlayOpacity = openValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.7],
      extrapolate: 'clamp',
    });
    //comment: disable bluring if we are using pushing content
    //(just my honest oppinion you may safely remove this check and writelike so
    // const animatedOverlayStyles = {
    //   opacity: overlayOpacity,
    // };
    //
    //
    //)
    const animatedOverlayStyles = {
      opacity: push ? 0 : overlayOpacity,
    };
    const pointerEvents = drawerShown ? 'auto' : 'none';

    return (

      <LinearGradient
        start={{ x: 0.0, y: 0.0 }}
        end={{ x: 0.0, y: 1.0 }}
        locations={[0, 1.0]}
        colors={["#7D4D99", "#6497CC"]}
        style={[
          squish && styles.squish,
          { flex: 1 },
        ]}
        {...this._panResponder.panHandlers}
      >
        {drawerShown &&
          squish &&
          left &&
          <Animated.View
            accessibilityViewIsModal={accessibilityViewIsModal}
            style={[
              !squish && styles.drawer,
              dynamicDrawerStyles,
              animatedDrawerStyles,

            ]}
          >
            {this.props.renderNavigationView()}
          </Animated.View>}
        <Animated.View
          style={[
            styles.main,
            //comment: just push main view with the drawer
            push && animatedMainStyles,
            squish && { flex: 2 },
          ]}
        >
          {this.props.children}
        </Animated.View>
        {!squish &&
          <TouchableWithoutFeedback
            pointerEvents={pointerEvents}
            onPress={this._onOverlayClick}
          >
            <Animated.View
              pointerEvents={pointerEvents}
              style={[styles.overlay, animatedOverlayStyles]}
            />
          </TouchableWithoutFeedback>}
        {(!squish || (drawerShown && right)) &&
          <Animated.View
            accessibilityViewIsModal={accessibilityViewIsModal}
            style={[
              !squish && styles.drawer,
              dynamicDrawerStyles,
              animatedDrawerStyles,
            ]}
          >
            {this.props.renderNavigationView()}
          </Animated.View>}
      </LinearGradient>
    );
  }

  _onOverlayClick = (e: EventType) => {
    e.stopPropagation();
    if (!this._isLockedClosed() && !this._isLockedOpen()) {
      this.closeDrawer();
    }
  };

  _emitStateChanged = (newState: string) => {
    if (this.props.onDrawerStateChanged) {
      this.props.onDrawerStateChanged(newState);
    }
  };

  _openDrawer = (options: DrawerMovementOptionType = {}, callback: any) => {
    callback = callback ? callback : () => this._emitStateChanged(IDLE);
    this._emitStateChanged(SETTLING);
    Animated.spring(this.state.openValue, {
      toValue: 1,
      bounciness: 0,
      restSpeedThreshold: 0.1,
      useNativeDriver: this.props.useNativeAnimations,
      ...options,
    })
      .start(callback);
  };

  openDrawer = (options: DrawerMovementOptionType = {}) => {
    this._openDrawer(options, () => {
      if (this.props.onDrawerOpen) {
        this.props.onDrawerOpen();
      }
      this._emitStateChanged(IDLE);
    });
  };

  _closeDrawer = (options: DrawerMovementOptionType = {}, callback: any) => {
    callback = callback ? callback : () => this._emitStateChanged(IDLE);
    this._emitStateChanged(SETTLING);
    Animated.spring(this.state.openValue, {
      toValue: 0,
      bounciness: 0,
      restSpeedThreshold: 1,
      useNativeDriver: this.props.useNativeAnimations,
      ...options,
    })
      .start(callback);
  };

  closeDrawer = (options: DrawerMovementOptionType = {}) => {
    this._emitStateChanged(SETTLING);
    this._closeDrawer(options, () => {
      if (this.props.onDrawerClose) {
        this.props.onDrawerClose();
      }
      this._emitStateChanged(IDLE);
    });
  };

  _handleDrawerOpen = () => {
    if (this.props.onDrawerOpen) {
      this.props.onDrawerOpen();
    }
  };

  _handleDrawerClose = () => {
    if (this.props.onDrawerClose) {
      this.props.onDrawerClose();
    }
  };

  _shouldSetPanResponder = (
    e: EventType,
    { moveX, dx, dy }: PanResponderEventType,
  ) => {
    if (!dx || !dy || Math.abs(dx) < MIN_SWIPE_DISTANCE) {
      return false;
    }

    if (this._isLockedClosed() || this._isLockedOpen()) {
      return false;
    }

    if (this.getDrawerPosition() === 'left') {
      const overlayArea = DEVICE_WIDTH -
        (DEVICE_WIDTH - this.props.drawerWidth);

      if (this._lastOpenValue === 1) {
        if (
          (dx < 0 && Math.abs(dx) > Math.abs(dy) * 3) || moveX > overlayArea
        ) {
          this._isClosing = true;
          this._closingAnchorValue = this._getOpenValueForX(moveX);
          return true;
        }
      } else {
        if (moveX <= 35 && dx > 0) {
          this._isClosing = false;
          return true;
        }

        return false;
      }
    } else {
      const overlayArea = DEVICE_WIDTH - this.props.drawerWidth;

      if (this._lastOpenValue === 1) {
        if (
          (dx > 0 && Math.abs(dx) > Math.abs(dy) * 3) || moveX < overlayArea
        ) {
          this._isClosing = true;
          this._closingAnchorValue = this._getOpenValueForX(moveX);
          return true;
        }
      } else {
        if (moveX >= DEVICE_WIDTH - 35 && dx < 0) {
          this._isClosing = false;
          return true;
        }

        return false;
      }
    }
  };

  _panResponderGrant = () => {
    this._emitStateChanged(DRAGGING);
  };

  _panResponderMove = (e: EventType, { moveX }: PanResponderEventType) => {
    let openValue = this._getOpenValueForX(moveX);

    if (this._isClosing) {
      openValue = 1 - (this._closingAnchorValue - openValue);
    }

    if (openValue > 1) {
      openValue = 1;
    } else if (openValue < 0) {
      openValue = 0;
    }

    this.state.openValue.setValue(openValue);
  };

  _panResponderRelease = (
    e: EventType,
    { moveX, vx }: PanResponderEventType,
  ) => {
    const previouslyOpen = this._isClosing;
    const isWithinVelocityThreshold = vx < VX_MAX && vx > -VX_MAX;

    if (this.getDrawerPosition() === 'left') {
      if (
        (vx > 0 && moveX > THRESHOLD) ||
        vx >= VX_MAX ||
        (isWithinVelocityThreshold && previouslyOpen && moveX > THRESHOLD)
      ) {
        this.openDrawer({ velocity: vx });
      } else if (
        (vx < 0 && moveX < THRESHOLD) ||
        vx < -VX_MAX ||
        (isWithinVelocityThreshold && !previouslyOpen)
      ) {
        this.closeDrawer({ velocity: vx });
      } else if (previouslyOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    } else {
      if (
        (vx < 0 && moveX < THRESHOLD) ||
        vx <= -VX_MAX ||
        (isWithinVelocityThreshold && previouslyOpen && moveX < THRESHOLD)
      ) {
        this.openDrawer({ velocity: (-1) * vx });
      } else if (
        (vx > 0 && moveX > THRESHOLD) ||
        vx > VX_MAX ||
        (isWithinVelocityThreshold && !previouslyOpen)
      ) {
        this.closeDrawer({ velocity: (-1) * vx });
      } else if (previouslyOpen) {
        this.openDrawer();
      } else {
        this.closeDrawer();
      }
    }
  };

  _isLockedClosed = () => {
    return this.props.drawerLockMode === 'locked-closed' &&
      !this.state.drawerShown;
  };

  _isLockedOpen = () => {
    return this.props.drawerLockMode === 'locked-open' &&
      this.state.drawerShown;
  };

  _getOpenValueForX(x: number): number {
    const { drawerWidth } = this.props;

    if (this.getDrawerPosition() === 'left') {
      return x / drawerWidth;
    }

    // position === 'right'
    return (DEVICE_WIDTH - x) / drawerWidth;
  }
}

const styles = StyleSheet.create({
  squish: {
    flexDirection: 'row',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    zIndex: 1001,
  },
  main: {
    flex: 1,
    zIndex: 0,
    top: 0,
    bottom: 0,
  },
  overlay: {
    backgroundColor: '#000',
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 1000,
  },
});