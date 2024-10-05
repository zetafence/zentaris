import React, { Component } from "react";
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Grid from "@mui/material/Grid";
import { Paper, Typography } from '@material-ui/core';

class ChartComponent extends Component {
    render() {
        const { mitreAttackTacticsData, riskCategories } = this.props.data;
        return (
            <Grid container spacing={4} margin={4} sx={{ mb: 5 }}>
                <Grid item xs={12} sm={6}>
                    <Paper elevation={3} style={{ height: 400, padding: 20 }}>
                        <Typography variant="h6" gutterBottom style={{ textAlign: 'center' }}>
                            ATT&CK Tactics
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mitreAttackTacticsData}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, name }) => (
                                        <text x={cx + (outerRadius + 10) * Math.cos(-midAngle * Math.PI / 180)} y={cy + (outerRadius + 10) * Math.sin(-midAngle * Math.PI / 180)} fill="#000" textAnchor="middle" dominantBaseline="central">
                                            {name}
                                        </text>
                                    )}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    labelLine={false}
                                >
                                    {mitreAttackTacticsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <Paper elevation={3} style={{ height: 400, padding: 20 }}>
                        <Typography variant="h6" gutterBottom style={{ textAlign: 'center' }}>
                            Risk Categories
                        </Typography>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={riskCategories}
                                    dataKey="value"
                                    nameKey="name"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, name }) => (
                                        <text x={cx + (outerRadius + 10) * Math.cos(-midAngle * Math.PI / 180)} y={cy + (outerRadius + 10) * Math.sin(-midAngle * Math.PI / 180)} fill="#000" textAnchor="middle" dominantBaseline="central">
                                            {name}
                                        </text>
                                    )}
                                    outerRadius={150}
                                    fill="#8884d8"
                                    labelLine={false}
                                >
                                    {riskCategories.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        );
    }
}

export default ChartComponent;
