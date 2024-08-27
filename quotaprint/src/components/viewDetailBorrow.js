import React, { useEffect, useState } from 'react';
import { Box, FormControl, FormControlLabel, InputLabel, FilledInput, Checkbox } from '@mui/material';
import axios from 'axios';

function ViewDetailBorrow({ requestID }) {
    const [data, setData] = useState({
        asset: '',
        borrowStatusID: ''
    });

    const [isInOfficeChecked, setInOfficeChecked] = useState(false);
    const [isOutOfficeChecked, setOutOfficeChecked] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/viewDetailBorrow', {
                    params: { requestID },
                });
                if (response.data.length > 0) {
                    // Assuming the response is an array with one object
                    const [data] = response.data;
                    setData({
                        asset: data.asset || '',
                        borrowStatusID: data.borrowStatusID || ''
                    });

                    // Set checkboxes based on borrow status
                    setInOfficeChecked(data.borrowStatusID === 1);
                    setOutOfficeChecked(data.borrowStatusID === 2);
                }
                // console.log('Data received from API:', response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [requestID]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '40%' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isInOfficeChecked} />}
                        label="In office"
                    />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '60%' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isOutOfficeChecked} />}
                        label="Out office (or more than 1 day)"
                    />
                </Box>
            </Box>
            <Box sx={{ width: '40%' }}>
                <FormControl variant="filled" fullWidth>
                    <InputLabel htmlFor="assetID">Asset</InputLabel>
                    <FilledInput id="assetID" value={data.asset} disabled />
                </FormControl>
            </Box>
        </Box>
    );
}

export default ViewDetailBorrow;
