import React, { useEffect, useState } from 'react';
import { Box, FormControl, FormControlLabel, InputLabel, FilledInput, Checkbox } from '@mui/material';
import axios from 'axios';

function ViewDetailQuota({ requestID }) {
    const [data, setData] = useState({
        blackWhite: 0,
        color: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/viewDetailQuota', {
                    params: { requestID },
                });
                if (response.data.length > 0) {
                    // Assuming the response is an array with one object
                    const [data] = response.data;
                    setData({
                        blackWhite: data.black_white || 0,
                        color: data.color || 0
                    });
                }
                // console.log('Data received from API:', response.data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, [requestID]);

    const isBlackWhiteChecked = data.blackWhite > 0;
    const isColorChecked = data.color > 0;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '30%' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isBlackWhiteChecked} />}
                        label="ขาวดำ (black/white)"
                    />
                    <Box sx={{ width: '45%' }}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel htmlFor="blackWhite">ขาวดำ (black/white)</InputLabel>
                            <FilledInput id="blackWhite" value={data.blackWhite} disabled />
                        </FormControl>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '30%' }}>
                    <FormControlLabel
                        control={<Checkbox checked={isColorChecked} />}
                        label="สี (color)"
                    />
                    <Box sx={{ width: '45%' }}>
                        <FormControl variant="filled" fullWidth>
                            <InputLabel htmlFor="color">สี (color)</InputLabel>
                            <FilledInput id="color" value={data.color} disabled />
                        </FormControl>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default ViewDetailQuota;
