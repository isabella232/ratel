// Copyright 2017-2019 Dgraph Labs, Inc. and Contributors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from "react";
import classnames from "classnames";
import { connect } from "react-redux";

import AclPage from "../components/ACL/AclPage";
import ClusterPage from "components/Cluster/ClusterPage";
import LicenseWarning from "components/LicenseWarning";
import QueryView from "../components/QueryView";
import Schema from "../components/schema/Schema";
import Sidebar from "../components/Sidebar";
import SidebarInfo from "../components/SidebarInfo";
import SidebarUpdateUrl from "../components/SidebarUpdateUrl";

import { checkHealth } from "../actions/connection";
import { runQuery } from "../actions/frames";
import { setActiveFrame } from "../actions/frames";
import { updateQueryAndAction } from "../actions/query";
import { clickSidebarUrl } from "../actions/ui";

import "../assets/css/App.scss";

class App extends React.Component {
    async componentDidMount() {
        const { activeFrameId, dispatchCheckHealth, frames } = this.props;

        if (!activeFrameId && frames.length) {
            const { id, query, action } = frames[0];
            this.handleSelectQuery(id, query, action);
        }
        checkHealth({ openUrlOnError: true });
    }

    getOverlayContent = overlayUrl => {
        if (overlayUrl === "info") {
            return <SidebarInfo />;
        }
        if (overlayUrl === "connection") {
            return (
                <SidebarUpdateUrl
                    onSubmit={this.handleUpdateConnectionAndRefresh}
                />
            );
        }
        return null;
    };

    handleSelectQuery = (frameId, query, action) => {
        const { handleUpdateQueryAndAction, handleSetActiveFrame } = this.props;

        handleUpdateQueryAndAction(query, action);
        handleSetActiveFrame(frameId);
    };

    handleSetQuery = (query, action) => {
        const { handleUpdateQueryAndAction } = this.props;

        handleUpdateQueryAndAction(query, action);
    };

    handleRunQuery = (query, action) => {
        this.props.dispatchRunQuery(query, action);
    };

    handleExternalQuery = query => {
        // Open the console
        this.props.clickSidebarUrl("");
        this.handleRunQuery(query, "query");
        this.handleSelectQuery(null, query, "query");
    };

    render() {
        const { clickSidebarUrl, mainFrameUrl, overlayUrl } = this.props;

        let mainFrameContent;
        switch (mainFrameUrl) {
            case "":
                mainFrameContent = (
                    <QueryView
                        handleRunQuery={this.handleRunQuery}
                        onSelectQuery={this.handleSelectQuery}
                        onSetQuery={this.handleSetQuery}
                    />
                );
                break;
            case "acl":
                mainFrameContent = <AclPage />;
                break;
            case "cluster":
                mainFrameContent = <ClusterPage />;
                break;
            case "schema":
                mainFrameContent = (
                    <Schema onOpenGeneratedQuery={this.handleExternalQuery} />
                );
                break;
            default:
                mainFrameContent = (
                    <div>Unknown main frame URL: {mainFrameUrl}</div>
                );
                break;
        }
        return (
            <>
                <Sidebar
                    currentMenu={overlayUrl || mainFrameUrl}
                    currentOverlay={this.getOverlayContent(overlayUrl)}
                    onToggleMenu={this.props.clickSidebarUrl}
                />
                <div
                    className={classnames(
                        "main-content",
                        mainFrameUrl || "console",
                    )}
                >
                    {overlayUrl ? (
                        <div
                            className="click-capture"
                            onClick={() => clickSidebarUrl(mainFrameUrl)}
                        />
                    ) : null}
                    <LicenseWarning />
                    {mainFrameContent}
                </div>
            </>
        );
    }
}

function mapStateToProps(state) {
    return {
        activeFrameId: state.frames.activeFrameId,
        frames: state.frames.items,
        frameResults: state.frames.frameResults,
        activeTab: state.frames.tab,

        mainFrameUrl: state.ui.mainFrameUrl,
        overlayUrl: state.ui.overlayUrl,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        clickSidebarUrl(url) {
            return dispatch(clickSidebarUrl(url));
        },
        dispatchCheckHealth(openUrlSettings) {
            return dispatch(checkHealth(openUrlSettings));
        },
        dispatchRunQuery(query, action) {
            return dispatch(runQuery(query, action));
        },
        handleSetActiveFrame(frameId) {
            return dispatch(setActiveFrame(frameId));
        },
        handleUpdateQueryAndAction(query, action) {
            dispatch(updateQueryAndAction(query, action));
        },
    };
}

export default connect(mapStateToProps, mapDispatchToProps)(App);
