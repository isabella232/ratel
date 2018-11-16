import React from "react";
import { connect } from "react-redux";
import ReactDOM from "react-dom";
import screenfull from "screenfull";
import classnames from "classnames";

import FrameHeader from "./FrameLayout/FrameHeader";

import { updateFrame } from "../actions/frames";

class FrameLayout extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isFullscreen: false,
            editingQuery: false,
        };
    }

    _frameRef = React.createRef();

    componentDidMount() {
        // Sync fullscreen exit in case exited by ESC.
        // IDEA: This is not efficient as there will be as many event listeners as
        // there are frames.
        document.addEventListener(
            screenfull.raw.fullscreenchange,
            this.syncFullscreenExit,
        );
    }

    componentWillUnmount() {
        document.removeEventListener(
            screenfull.raw.fullscreenchange,
            this.syncFullscreenExit,
        );
    }

    /**
     * sycnFullscreenExit checks if fullscreen, and updates the state to false if not.
     * used as a callback to fullscreen change event. Needed becasue a user might
     * exit fullscreen by pressing ESC.
     */
    syncFullscreenExit = () => {
        const isFullscreen = screenfull.isFullscreen;

        if (!isFullscreen) {
            this.setState({ isFullscreen: false });
        }
    };

    handleToggleFullscreen = () => {
        if (!screenfull.enabled) {
            return;
        }

        const { isFullscreen } = this.state;

        if (isFullscreen) {
            screenfull.exit();
            this.setState({ isFullscreen: false });
        } else {
            const frameEl = ReactDOM.findDOMNode(this._frameRef.current);
            screenfull.request(frameEl);

            // If fullscreen request was successful, set state.
            if (screenfull.isFullscreen) {
                this.setState({ isFullscreen: true });
            }
        }
    };

    handleToggleEditingQuery = () => {
        this.setState(
            {
                editingQuery: !this.state.editingQuery,
            },
            () => {
                if (this.state.editingQuery) {
                    this.queryEditor.focus();
                }
            },
        );
    };

    handleToggleCollapse = (done = () => {}) => {
        const { changeCollapseState, frame, collapseAllFrames } = this.props;
        const shouldCollapse = !frame.meta.collapsed;

        // If the frame will expand, first collapse all other frames to avoid slow
        // rendering.
        if (!shouldCollapse) {
            collapseAllFrames();
        }

        changeCollapseState(frame, shouldCollapse);
        done();
    };

    render() {
        const {
            children,
            onDiscardFrame,
            onSelectQuery,
            frame,
            forceCollapsed,
            responseFetched,
        } = this.props;
        const { editingQuery, isFullscreen } = this.state;
        const isCollapsed =
            forceCollapsed !== undefined
                ? forceCollapsed
                : frame.meta && frame.meta.collapsed;

        return (
            <li
                className={classnames("frame-item", {
                    fullscreen: isFullscreen,
                    collapsed: isCollapsed,
                    "frame-session": responseFetched,
                })}
                ref={this._frameRef}
            >
                <FrameHeader
                    frame={frame}
                    isFullscreen={isFullscreen}
                    isCollapsed={isCollapsed}
                    editingQuery={editingQuery}
                    onToggleFullscreen={this.handleToggleFullscreen}
                    onToggleCollapse={this.handleToggleCollapse}
                    onToggleEditingQuery={() => {
                        if (frame.meta.collapsed) {
                            this.handleToggleCollapse(
                                this.handleToggleEditingQuery,
                            );
                        } else {
                            this.handleToggleEditingQuery();
                        }
                    }}
                    onDiscardFrame={onDiscardFrame}
                    onSelectQuery={onSelectQuery}
                />
                {!isCollapsed ? children : null}
            </li>
        );
    }
}

function mapStateToProps(state) {
    return {
        url: state.url,
    };
}

function mapDispatchToProps(dispatch, ownProps) {
    return {
        changeCollapseState(frame, nextCollapseState) {
            const { onAfterExpandFrame, onAfterCollapseFrame } = ownProps;

            dispatch(
                updateFrame({
                    id: frame.id,
                    meta: { ...frame.meta, collapsed: nextCollapseState },
                }),
            );

            // Execute callbacks.
            if (nextCollapseState && onAfterCollapseFrame) {
                onAfterCollapseFrame();
            }
            if (!nextCollapseState && onAfterExpandFrame) {
                onAfterExpandFrame(frame.query, frame.action);
            }
        },
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(FrameLayout);
