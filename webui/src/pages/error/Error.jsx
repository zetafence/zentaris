import React, { Component } from "react";
import { withRouter } from "react-router";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const DEFAULT_ERROR_MSG = "no error message",
    ERROR_PARAM = "msg";

class Error extends Component {
    constructor(props) {
        super(props);

        const getErrorMsg = () => {
            var loc = this.props.location;
            if (loc === null || loc === undefined) {
                return DEFAULT_ERROR_MSG;
            }
            var param = new URLSearchParams(loc.search);
            if (param !== null && param !== undefined) {
                return param.get(ERROR_PARAM);
            }
            return DEFAULT_ERROR_MSG;
        }
        this.state = {
            errorMsg: getErrorMsg(),
        };

        // bind routines
        this.handleErrorDialogButtonOk = this.handleErrorDialogButtonOk.bind(this);
        this.handleErrorDialogButtonClose = this.handleErrorDialogButtonClose.bind(this);
    }

    handleErrorDialogButtonOk() {
        this.handleErrorDialogButtonClose();
    }

    handleErrorDialogButtonClose() {
        this.setState({
            errorMsg: "",
        });
    }

    render() {
        return (
            <div className="error">
                <Dialog
                    open={this.state.errorMsg !== ""}
                    onClose={this.handleErrorDialogButtonClose}
                    fullWidth
                >
                    <DialogTitle variant="h4" sx={{ boxShadow: 1 }}>
                        Error
                    </DialogTitle>
                    <DialogContent>

                        <Typography
                            variant="h6"
                            sx={{ mt: 2 }}
                        >
                            {this.state.errorMsg}
                        </Typography>

                    </DialogContent>
                    <DialogActions>
                        <Button
                            variant="contained"
                            onClick={this.handleErrorDialogButtonOk}
                        >
                            Ok
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default withRouter(Error);
