import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Autocomplete, Button, Modal, Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

function Main() {
    const [data, setData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filterYear, setFilterYear] = useState('');
    const [filterDivision, setFilterDivision] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterRequestTypeName, setFilterRequestTypeName] = useState('');
    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [years, setYears] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [requestTypes, setRequestTypes] = useState([]);
    const navigate = useNavigate();
    const [filterOwnerJob, setFilterOwnerJob] = useState('');
    const [ownerJobs, setOwnerJobs] = useState([]);
    const [filterDeliveryDate, setFilterDeliveryDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [divisionsResponse, statusesResponse, yearResponse, requestTypesResponse, ownerJobsResponse] = await Promise.all([
                    axios.get('http://localhost:5000/api/division'),
                    axios.get('http://localhost:5000/api/status'),
                    axios.get('http://localhost:5000/api/year'),
                    axios.get('http://localhost:5000/api/requestType'),
                    axios.get('http://localhost:5000/api/ownerJob')
                ]);

                const divisionData = divisionsResponse.data.map(item => item.divisionName);
                const statusData = statusesResponse.data.map(item => item.requestStatus);
                const requestTypeData = requestTypesResponse.data.map(item => item.requestTypeName);
                const ownerJobData = ownerJobsResponse.data.map(item => item.ownerJob);

                setDivisions(divisionData);
                setStatuses(statusData);
                setRequestTypes(requestTypeData);
                setOwnerJobs(ownerJobData);

                const sumYearData = yearResponse.data;
                const yearData = [...new Set(sumYearData.map(item => item.year))].sort((a, b) => b - a);
                setYears(yearData);

                if (sumYearData.length > 0) {
                    const mostRecentYear = Math.max(...sumYearData.map(item => item.year));
                    setFilterYear(mostRecentYear);
                    fetchFilteredData(mostRecentYear);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const fetchFilteredData = async (year, division, requester, requestTypeName, startDate, endDate, status, ownerJob, deliveryDate) => {
        try {
            const [listResponse] = await Promise.all([
                axios.get('http://localhost:5000/api/all', {
                    params: {
                        year,
                        division,
                        requester,
                        requestTypeName,
                        startDate: startDate ? moment(startDate).format('YYYY-MM-DD') : null,
                        endDate: endDate ? moment(endDate).format('YYYY-MM-DD') : null,
                        status,
                        ownerJob,
                        deliveryDate: deliveryDate ? moment(deliveryDate).format('YYYY-MM-DD') : null
                    }
                }),
            ]);
    
            const formattedData = listResponse.data.map(row => ({
                ...row,
                deliveryDate: moment(row.deliveryDate).format('DD-MM-YYYY'),
                requestDateStart: moment(row.requestDateStart).format('DD-MM-YYYY'),
                requestDateEnd: moment(row.requestDateEnd).format('DD-MM-YYYY'),
                priorityName: row.priorityName
            }));

            setData(formattedData);
            setFilteredData(formattedData);
    
        } catch (error) {
            console.error('Error fetching filtered data:', error);
        }
    };
    
    const handleFilter = () => {
        fetchFilteredData(
            filterYear, 
            filterDivision, 
            filterUser, 
            filterRequestTypeName, 
            filterStartDate, 
            filterEndDate, 
            filterStatus, 
            filterOwnerJob, 
            filterDeliveryDate
        );
        setFilterModalOpen(false);
    };

    const columns = [
        { field: 'requestNo', headerName: 'Request No.', width: 130 },
        { field: 'requestTypeName', headerName: 'Request Name', width: 130 },
        { field: 'subjectTypeName', headerName: 'Topic', width: 130 },
        { field: 'requester', headerName: 'Requester', width: 130 },
        { field: 'divisionName', headerName: 'Division', width: 130 },
        { field: 'deliveryDate', headerName: 'DeliveryDate', width: 130 },
        { field: 'requestDateStart', headerName: 'Request DateStart', width: 130 },
        { field: 'requestDateEnd', headerName: 'Request DateEnd', width: 130 },
        { field: 'ownerJob', headerName: 'Owner Job', width: 130 },
        { field: 'requestStatus', headerName: 'Request Status', width: 130 },
        {
            field: 'view',
            headerName: 'Detail',
            width: 100,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleViewClick(params.row)}
                >
                    View
                </Button>
            ),
        },
    ];

    const handleViewClick = (rowData) => {
        navigate('/view-detail', { state: { data: rowData } });
    };

    const handleSearch = async (event) => {
        const searchText = event.target.value;
        setSearchText(searchText);
    
        if (!searchText.trim()) {
            setFilteredData(data);
            return;
        }
    
        try {
            const response = await axios.get('http://localhost:5000/api/searchMain', {
                params: {
                    searchText,
                    year: filterYear
                }
            });
            
            console.log('Search Text:', response);

            const formattedData = response.data.map(row => ({
                ...row,
                deliveryDate: moment(row.deliveryDate).format('DD-MM-YYYY'),
                requestDateStart: moment(row.requestDateStart).format('DD-MM-YYYY'),
                requestDateEnd: moment(row.requestDateEnd).format('DD-MM-YYYY'),
                priorityName: row.priorityName
            }));
    
            setFilteredData(formattedData);
    
        } catch (error) {
            console.error('Error fetching search data:', error);
        }
    };

    return (
        <div>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1%' }}>Request</h1>
            <div style={{ display: 'flex', margin: '10px 0' }}>
                <TextField
                    label="Search"
                    variant="outlined"
                    value={searchText}
                    onChange={handleSearch}
                    style={{ margin: '0 10px', width: '400px' }}
                />
                <Button variant="outlined" onClick={() => setFilterModalOpen(true)} style={{ marginRight: '10px' }}>
                    Filter
                </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', margin: '0 10px' }}>
                <div style={{ height: 600, width: '100%' }}>
                    <DataGrid
                        rows={filteredData.map((row, index) => ({ id: index, ...row }))}
                        columns={columns}
                        checkboxSelection={false}
                        autoHeight
                        initialState={{
                            pagination: {
                              paginationModel: { page: 0, pageSize: 20 },
                            },
                          }}
                        pageSizeOptions={[20, 40, 60, 80, 100]}
                    />
                </div>
            </div>

            <Modal
                open={filterModalOpen}
                onClose={() => setFilterModalOpen(false)}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box sx={{
                         width: 'auto',
                        maxWidth: '40%',
                        maxHeight: '80vh',
                        overflowY: 'auto',
                        p: 3,
                        backgroundColor: 'white',
                        margin: 'auto',
                        marginTop: '3%',
                        borderRadius: 1,
                        boxShadow: 3
                    }}>
                    <h2 id="modal-title" style={{ textAlign: 'center' }}>Filter Options</h2>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="year-label">Select Year</InputLabel>
                        <Select
                            labelId="year-label"
                            label="Select Year"
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {years.map(year => (
                                <MenuItem key={year} value={year}>{year}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="request-type-label">Request Type</InputLabel>
                        <Select
                            labelId="request-type-label"
                            label="Request Type"
                            value={filterRequestTypeName}
                            onChange={(e) => setFilterRequestTypeName(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {requestTypes.map(type => (
                                <MenuItem key={type} value={type}>{type}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Autocomplete
                        options={divisions}
                        getOptionLabel={(option) => option}
                        value={filterDivision}
                        onChange={(event, newValue) => setFilterDivision(newValue)}
                        isOptionEqualToValue={(option, value) => option === value || value === ""}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Division"
                                margin="normal"
                                fullWidth
                            />
                        )}
                    />
                    <TextField
                        label="Search User"
                        variant="outlined"
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Delivery Date"
                        variant="outlined"
                        type="date"
                        value={filterDeliveryDate ? moment(filterDeliveryDate).format('YYYY-MM-DD') : ''}
                        onChange={(e) => setFilterDeliveryDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />
                    <Box display="flex" alignItems="center">
                        <TextField
                            label="Start Date"
                            variant="outlined"
                            type="date"
                            value={filterStartDate ? moment(filterStartDate).format('YYYY-MM-DD') : ''}
                            onChange={(e) => setFilterStartDate(e.target.value)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                        <Typography variant="-" style={{ margin: '0 10px' }}>
                            -
                        </Typography>
                        <TextField
                            label="End Date"
                            variant="outlined"
                            type="date"
                            value={filterEndDate ? moment(filterEndDate).format('YYYY-MM-DD') : ''}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>
                    <Autocomplete
                        options={ownerJobs}
                        getOptionLabel={(option) => option}
                        value={filterOwnerJob}
                        onChange={(event, newValue) => setFilterOwnerJob(newValue)}
                        isOptionEqualToValue={(option, value) => option === value || value === ""}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Owner Job"
                                margin="normal"
                                fullWidth
                            />
                        )}
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="status-label">Select Status</InputLabel>
                        <Select
                            labelId="status-label"
                            label="Select Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {statuses.map(status => (
                                <MenuItem key={status} value={status}>{status}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <Button variant="outlined" onClick={() => setFilterModalOpen(false)} style={{ marginRight: '10px' }}>
                            Cancel
                        </Button>
                        <Button variant="contained" onClick={handleFilter}>
                            Apply
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </div>
    );
}

export default Main;
