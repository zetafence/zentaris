import React, { Component } from "react";
import { withRouter } from "react-router";
import "./risk.css";
import { GetProfileDetails } from '../../api';
import Grid from "@mui/material/Grid";
import ChartComponent from './ChartComponent';
import { schemeCategory10 as d3SchemeCategory10 } from 'd3-scale-chromatic';
import { interpolateRgb as d3InterpolateRgb } from 'd3-interpolate';
import { Paper } from '@material-ui/core';
import { StyledTableCell, StyledTableRow } from "../../components/tables/Tables";
import {
    Table, TableCell, TableBody, TableContainer, TableHead, TableRow, TablePagination, Typography
} from '@mui/material';
import { FetchProfilePosture } from '../../api';

const IGNORE_STR = "ignore";

class Risk extends Component {
    constructor(props) {
        super(props);

        var profileDetails = GetProfileDetails();

        // stats data for presentation
        this.state = {
            rows: [],
            rowsPerPage: 5,
            pageNum: 0,
            mitreJson: null,
            group: profileDetails[0],
            profileId: profileDetails[1],
        }

        // bind local routines
        this.generatePieChartData = this.generatePieChartData.bind(this);
        this.getCustomTable = this.getCustomTable.bind(this);
        this.handleChangePage = this.handleChangePage.bind(this);
        this.handleChangeRowsPerPage = this.handleChangeRowsPerPage.bind(this);

        // initializes row headers
        this.rowHeaders = [
            "Severity",
            "MITRE Tactic",
            "Risk Category",
            "Affected",
            "Description",
            "Remediation",
        ];
        this.fetchPosture();
    }

    // fetchPosture fetches behavioral posture
    fetchPosture() {
        var prom = FetchProfilePosture(this.state.group, this.state.profileId, IGNORE_STR);
        prom.then((value) => {
            if (value === undefined || value === "" ||
                value.response === undefined || value.response === "") {
                return;
            }
            try {
                const json = JSON.parse(value.response);
                this.setState({
                    mitreJson: json,
                });
            } catch (error) {
                console.error('error parsing JSON string ', error.message);
            }
        });
    }

    // handleChangePage handles change in page numbers
    handleChangePage(event, newPage) {
        this.setState({
            pageNum: newPage,
        });
    }

    // handleChangeRowsPerPage handles changes to rows in pages
    handleChangeRowsPerPage(event) {
        this.setState({
            rowsPerPage: event.target.value,
            pageNum: 0,
        });
    }

    getCustomTable(rows) {
        if (rows === undefined || rows.length === 0) {
            return <></>;
        }
        const page = this.state.pageNum, rowsPerPage = this.state.rowsPerPage;
        return (
            <Paper>
                <TableContainer component={Paper}
                    sx={{
                        boxShadow: '2px 4px 4px rgba(0, 0, 0, 0.5)',
                    }}
                >
                    <Table sx={{ minWidth: 700, bgcolor: 'silvergrey' }} aria-label="customized table">
                        <TableHead>
                            <TableRow>
                                {this.rowHeaders.map((rhead) => (
                                    <TableCell align="left" sx={{ bgcolor: 'orange', fontWeight: 'bold' }}>
                                        {rhead}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((row, index) => {
                                    return (
                                        <>
                                            <StyledTableRow key={row.description}>
                                                <StyledTableCell align="left">{row.severityLevel}</StyledTableCell>
                                                <StyledTableCell align="left">{row.mitreAttackTactics[0]}</StyledTableCell>
                                                <StyledTableCell align="left">{row.riskCategories[0]}</StyledTableCell>
                                                <StyledTableCell align="left">{row.affected}</StyledTableCell>
                                                <StyledTableCell align="left">{row.description}</StyledTableCell>
                                                <StyledTableCell align="left">
                                                    {this.getRecommendationBullets(row.remediationRecommendations)}
                                                </StyledTableCell>
                                            </StyledTableRow>

                                        </>
                                    );
                                })}
                        </TableBody>
                    </Table>
                </TableContainer >
                <TablePagination
                    rowsPerPageOptions={[10, 25, 100]}
                    component="div"
                    count={rows.length}
                    rowsPerPage={this.state.rowsPerPage}
                    page={this.state.pageNum}
                    onPageChange={this.handleChangePage}
                    onRowsPerPageChange={this.handleChangeRowsPerPage}
                />
            </Paper>
        );
    }

    getRecommendationBullets(recos) {
        return (
            <ul>
                {recos.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        );
    }

    // Generate pie chart data
    generatePieChartData(data) {
        const countMap = {};
        data.forEach(item => {
            item.forEach(value => {
                if (!countMap[value]) {
                    countMap[value] = 0;
                }
                countMap[value]++;
            });
        });

        const lighterSchemeCategory10 = d3SchemeCategory10.map(color =>
            d3InterpolateRgb(color, '#ffffff')(0.3)
        );

        var objArray = Array.from(data, ([key, value], index) => {
            const color = lighterSchemeCategory10[index % 10];
            return { name: key, value: countMap[key], color: color };
        });
        return objArray;
    }

    render() {
        // Generate data for MITRE attack tactics and techniques
        const mitreJson = this.state.mitreJson;
        if (mitreJson === null) {
            return <>
                <Typography variant="h4" color="primary" component="p">
                    {this.state.profileId === "" ?
                        "Please choose a profile to view posture." :
                        "Posture being generated. Please try again after a few minutes."
                    }
                </Typography></>;
        }
        const mitreAttackTacticsData = this.generatePieChartData(mitreJson.mitreAttackReport.findings.map(finding => finding.mitreAttackTactics));
        const riskCategories = this.generatePieChartData(mitreJson.mitreAttackReport.findings.map(finding => finding.riskCategories));

        const data = {
            mitreAttackTacticsData,
            riskCategories
        };

        var rowData = [...mitreJson.mitreAttackReport.findings];

        return (
            <>
                {/* grid with pie charts */}
                <Grid container spacing={4}>
                    <ChartComponent data={data} />
                </Grid>

                {/* grid with tables */}
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12}>
                        {this.getCustomTable(rowData)}
                    </Grid>
                </Grid>
            </>
        );
    }
}

export default withRouter(Risk)
