import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { TextField, Autocomplete, Button, Modal, Box, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import PieChartBorrow from './pieChartBorrow';

function BorrowLaptop() {
    const [data, setData] = useState([]);
    const [sumYearData, setSumYearData] = useState([]);
    const [sumUserData, setSumUserData] = useState([]);
    const [filteredSumUserData, setFilteredSumUserData] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filteredData, setFilteredData] = useState([]);
    const [filterModalOpen, setFilterModalOpen] = useState(false);
    const [filterYear, setFilterYear] = useState('');
    const [filterDivision, setFilterDivision] = useState('');
    const [filterRequester, setFilterRequester] = useState('');
    const [filterStartDate, setFilterStartDate] = useState(null);
    const [filterEndDate, setFilterEndDate] = useState(null);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterBorrowStatus, setFilterBorrowStatus] = useState('');
    const [filterLocation, setFilterLocation] = useState('');
    const [years, setYears] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [statuses, setStatuses] = useState([]);
    const [borrowStatuses, setBorrowStatuses] = useState([]);
    const [locations, setLocations] = useState([]);
    const [filterDeliveryDate, setFilterDeliveryDate] = useState(null);
    const [filterCriteria, setFilterCriteria] = useState({
        year: '',
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [divisionsResponse, statusesResponse, borrowStatusResponse, locationResponse, yearResponse] = await Promise.all([
                    axios.get('http://localhost:5000/api/division', { params: { table: 'BorrowNotebook' } }),
                    axios.get('http://localhost:5000/api/status'),
                    axios.get('http://localhost:5000/api/borrowStatus'),
                    axios.get('http://localhost:5000/api/location'),
                    axios.get('http://localhost:5000/api/year', { params: { table: 'BorrowNotebook' } })
                ]);
    
                const divisionData = divisionsResponse.data.map(item => item.divisionName);
                const statusData = statusesResponse.data.map(item => item.requestStatus);
                const borrowStatusData = borrowStatusResponse.data.map(item => item.borrowStatusName);
                const locationData = locationResponse.data.map(item => item.locationName);
    
                setDivisions(divisionData);
                setStatuses(statusData);
                setBorrowStatuses(borrowStatusData);
                setLocations(locationData);
    
                const sumYearData = yearResponse.data;
                const yearData = [...new Set(sumYearData.map(item => item.year))].sort((a, b) => b - a);
                setYears(yearData);
                setSumYearData(sumYearData);
    
                if (sumYearData.length > 0) {
                    const mostRecentYear = Math.max(...sumYearData.map(item => item.year));
                    setFilterYear(mostRecentYear);
                    setFilterCriteria(prevCriteria => ({ ...prevCriteria, year: mostRecentYear }));
                    fetchFilteredData(mostRecentYear);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
    
        fetchData();
    }, []);
    
    useEffect(() => {
        const filteredSumUser = sumUserData.filter(item => {
            const isYearMatch = !filterCriteria.year || item.year === filterCriteria.year;
            return isYearMatch;
        });

        setFilteredSumUserData(filteredSumUser);
    }, [filterCriteria, sumYearData, sumUserData]);

    const fetchFilteredData = async (year, division, requester, borrowStartDate, borrowEndDate, status, borrowStatus, location, deliveryDate) => {
        try {
            const [borrowListResponse, sumYearResponse, sumUserResponse] = await Promise.all([
                axios.get('http://localhost:5000/api/borrowList', {
                    params: {
                        year,
                        division,
                        requester,
                        borrowStartDate: borrowStartDate ? moment(borrowStartDate).format('YYYY-MM-DD') : null,
                        borrowEndDate: borrowEndDate ? moment(borrowEndDate).format('YYYY-MM-DD') : null,
                        status,
                        borrowStatus,
                        location,
                        deliveryDate: deliveryDate ? moment(deliveryDate).format('YYYY-MM-DD') : null
                    }
                }),
                axios.get('http://localhost:5000/api/sumYear', { params: { year } }),
                axios.get('http://localhost:5000/api/sumBorrow', { params: { year } }),
            ]);
    
            const formattedData = borrowListResponse.data.map(row => ({
                ...row,
                deliveryDate: moment(row.deliveryDate).format('DD-MM-YYYY'),
                borrowStartDate: moment(row.borrowStartDate).format('DD-MM-YYYY'),
                borrowEndDate: moment(row.borrowEndDate).format('DD-MM-YYYY'),
                priorityName: row.priorityName
            }));
            
            setData(formattedData);
            setFilteredData(formattedData);
            setSumYearData(sumYearResponse.data);
            setSumUserData(sumUserResponse.data);
    
        } catch (error) {
            console.error('Error fetching filtered data:', error);
        }
    };

    const handleFilter = () => {
        setFilterCriteria({
            year: filterYear,

        });

        fetchFilteredData(
            filterYear,
            filterDivision,
            filterRequester,
            filterStartDate,
            filterEndDate,
            filterStatus,
            filterBorrowStatus,
            filterLocation,
            filterDeliveryDate
        );
        setFilterModalOpen(false);
    };

    const columns = [
        { field: 'requestNo', headerName: 'Request No.', width: 130 },
        { field: 'subjectTypeName', headerName: 'Topic', width: 130 },
        { field: 'asset', headerName: 'AssetID', width: 130 },
        { field: 'requester', headerName: 'Requester', width: 130 },
        { field: 'divisionName', headerName: 'Division', width: 130 },
        { field: 'deliveryDate', headerName: 'DeliveryDate', width: 130 },
        { field: 'borrowStartDate', headerName: 'BorrowStart', width: 130 },
        { field: 'borrowEndDate', headerName: 'BorrowEnd', width: 130 },
        { field: 'ownerJob', headerName: 'Owner Job', width: 130 },
        { field: 'borrowStatusName', headerName: 'Borrow Status', width: 130 },
        { field: 'locationName', headerName: 'Location', width: 130 }, 
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
            const response = await axios.get('http://localhost:5000/api/searchBorrow', {
                params: {
                    searchText,
                    year: filterYear
                }
            });
            
            console.log('Search Text:', response);

            const formattedData = response.data.map(row => ({
                ...row,
                deliveryDate: moment(row.deliveryDate).format('DD-MM-YYYY'),
                borrowStartDate: moment(row.borrowStartDate).format('DD-MM-YYYY'),
                borrowEndDate: moment(row.borrowEndDate).format('DD-MM-YYYY'),
                priorityName: row.priorityName
            }));
    
            setFilteredData(formattedData);
    
        } catch (error) {
            console.error('Error fetching search data:', error);
        }
    };

    return (
        <div>
            <h1 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '1%' }}>Borrow Laptop</h1>
            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '10px' }}>
                <div style={{ flex: 1 }}>
                    <PieChartBorrow data={filteredSumUserData} />
                </div>
            </div>
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
                        marginTop: '2%',
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
                        value={filterRequester}
                        onChange={(e) => setFilterRequester(e.target.value)}
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
                            label="Start Borrow"
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
                            label="End Borrow"
                            variant="outlined"
                            type="date"
                            value={filterEndDate ? moment(filterEndDate).format('YYYY-MM-DD') : ''}
                            onChange={(e) => setFilterEndDate(e.target.value)}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Box>  
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
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="borrowstatus-label">Borrow Status</InputLabel>
                        <Select
                            labelId="borrowstatus-label"
                            label="Borrow Status"
                            value={filterBorrowStatus}
                            onChange={(e) => setFilterBorrowStatus(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {borrowStatuses.map((borrowStatus) => (
                                <MenuItem key={borrowStatus} value={borrowStatus}>
                                    {borrowStatus}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="location-label">Location</InputLabel>
                        <Select
                            labelId="location-label"
                            label="Location"
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                        >
                            <MenuItem value=""><em>None</em></MenuItem>
                            {locations.map(location => (
                                <MenuItem key={location} value={location}>
                                    {location}
                                </MenuItem>
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

export default BorrowLaptop;
