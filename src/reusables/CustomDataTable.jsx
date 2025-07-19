import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Box,
    Typography,
    TableSortLabel,
    IconButton,
    Collapse,
} from '@mui/material';
import { Icon } from '@iconify/react';

export default function CustomDatatable({
    dataSource = [],
    columns = [],
    page,
    limit,
    totalRecords,
    showPagination = true,
    handlePageChange,
    handleLimitChange,
    handleSort,
    sortColumn = '',
    sortDirection = 'asc',
    rowsPerPageOptions = [5, 10, 25, 50, 100],
    renderExpandableRow,
    expandKey = 'id',
    getRowStyle = () => ({}),
    onRowClick, // Tambahkan prop onRowClick
}) {
    const [expandedRow, setExpandedRow] = useState(null);
    const safeDataSource = Array.isArray(dataSource) ? dataSource : [];

    const toggleRow = (row) => {
        const rowKey = row[expandKey];
        setExpandedRow(expandedRow === rowKey ? null : rowKey);
    };

    return (
        <Paper
            sx={{
                border: `1px solid var(--color-project-grey-5)`,
                borderRadius: '8px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <TableContainer sx={{ flex: 1 }}>
                <Table stickyHeader>
                    <TableHead
                        sx={{
                            '& .MuiTableCell-root': {
                                backgroundColor: 'var(--color-project-grey-5)',
                            },
                        }}
                    >
                        <TableRow>
                            {renderExpandableRow && <TableCell />}
                            {columns.map((col, index) => (
                                <TableCell
                                    key={col.key || index}
                                    sx={{
                                        fontSize: 14,
                                        fontWeight: 400,
                                        cursor: col.sortable
                                            ? 'pointer'
                                            : 'default',
                                    }}
                                    width={col.width || 'auto'}
                                >
                                    {col.sortable ? (
                                        <TableSortLabel
                                            active={sortColumn === col.key}
                                            direction={
                                                sortColumn === col.key
                                                    ? sortDirection
                                                    : 'asc'
                                            }
                                            onClick={() => handleSort(col.key)}
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 400,
                                            }}
                                        >
                                            {col.title}
                                        </TableSortLabel>
                                    ) : (
                                        col.title
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {safeDataSource.length > 0 ? (
                            safeDataSource.map((row, index) => (
                                <React.Fragment key={row[expandKey] || index}>
                                    <TableRow
                                        style={getRowStyle(row)}
                                        onClick={() => onRowClick && onRowClick(row)} // Tambahkan onClick di sini
                                        sx={{ cursor: onRowClick ? 'pointer' : 'default' }} // Ubah kursor jika onRowClick ada
                                    >
                                        {renderExpandableRow && (
                                            <TableCell width={10}>
                                                <IconButton
                                                    onClick={() =>
                                                        toggleRow(row)
                                                    }
                                                    size="small"
                                                >
                                                    <Icon
                                                        icon={
                                                            expandedRow ===
                                                            row[expandKey]
                                                                ? 'mdi:chevron-down'
                                                                : 'mdi:chevron-right'
                                                        }
                                                    />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                        {columns.map((col, index) => (
                                            <TableCell
                                                key={`${row[expandKey]}-${col.key}`}
                                                width={col.width || 'auto'}
                                            >
                                                {col.render
                                                    ? col.render(
                                                          row[col.dataIndex],
                                                          row,
                                                          index,
                                                      )
                                                    : row[col.dataIndex]}
                                            </TableCell>
                                        ))}
                                    </TableRow>

                                    {renderExpandableRow && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={columns.length + 1}
                                                style={{
                                                    paddingBottom: 0,
                                                    paddingTop: 0,
                                                }}
                                            >
                                                <Collapse
                                                    in={
                                                        expandedRow ===
                                                        row[expandKey]
                                                    }
                                                    timeout="auto"
                                                    unmountOnExit
                                                >
                                                    <Box sx={{ margin: 2 }}>
                                                        {renderExpandableRow(
                                                            row,
                                                        )}
                                                    </Box>
                                                </Collapse>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length +
                                        (renderExpandableRow ? 1 : 0)
                                    }
                                    align="center"
                                >
                                    <Box
                                        display="flex"
                                        flexDirection="column"
                                        alignItems="center"
                                        py={5}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            color="textSecondary"
                                            mt={2}
                                        >
                                            No Data Available
                                        </Typography>
                                    </Box>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {safeDataSource.length > 0 && showPagination && (
                <TablePagination
                    rowsPerPageOptions={rowsPerPageOptions}
                    component="div"
                    count={totalRecords || safeDataSource.length}
                    rowsPerPage={limit}
                    page={page}
                    onPageChange={(_, newPage) => handlePageChange(newPage)}
                    onRowsPerPageChange={(event) =>
                        handleLimitChange(parseInt(event.target.value, 10))
                    }
                    sx={{
                        borderTop: `1px solid #F5F5F5`,
                        minHeight: '56px',
                        overflow: 'hidden',
                    }}
                />
            )}
        </Paper>
    );
}