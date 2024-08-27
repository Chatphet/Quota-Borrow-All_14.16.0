const express = require("express");
const cors = require("cors");
const app = express();
const { connectAndQuery } = require("./sql");
const sql = require("mssql/msnodesqlv8");
require("dotenv").config();

app.use(cors());
const port = 5000;

app.get("/api/year", async function (req, res, next) {
    const table = req.query.table;

    let sqlQuery = `SELECT YEAR(r.deliveryDate) AS year FROM Request r`;
    
    const validTables = ['QuotaPrint', 'BorrowNotebook'];
    if (table && validTables.includes(table)) {
        sqlQuery += ` INNER JOIN ${table} x ON r.requestID = x.requestID`;
    }

    sqlQuery += ` GROUP BY YEAR(r.deliveryDate)`;

    try {
        const data = await connectAndQuery(sqlQuery, []);

        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/division", async function (req, res, next) {
    const table = req.query.table;

    let sqlQuery = `SELECT r.divisionName FROM Request r`

    const validTables = ['QuotaPrint', 'BorrowNotebook']; // ใส่ชื่อตารางที่อนุญาต
    if (table && validTables.includes(table)) {
        sqlQuery += ` INNER JOIN ${table} x ON r.requestID = x.requestID`;
    }

    sqlQuery += ` GROUP BY r.divisionName`; 

    try {
        const data = await connectAndQuery(sqlQuery, []);

        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/list", async function (req, res, next) {
    const {
        year,
        division,
        requester,
        startDate,
        endDate,
        status,
        blackWhite,
        color,
        deliveryDate
    } = req.query;

    let conditions = [
        { name: 'YEAR(r.deliveryDate)', value: year, operator: '=' },
        { name: 'LOWER(r.divisionName)', value: division && division.toLowerCase(), operator: '=' },
        { name: 'LOWER(r.requester)', value: requester && `%${requester.toLowerCase()}%`, operator: 'LIKE' },
        { name: 'r.deliveryDate', value: deliveryDate, operator: '=' },
        { name: 'r.requestDateStart', value: startDate, operator: '>=' },
        { name: 'r.requestDateEnd', value: endDate, operator: '<=' },
        { name: 'LOWER(rs.requestStatus)', value: status && status.toLowerCase(), operator: '=' },
    ];

    let where = [];
    let queryParams = [];

    conditions.forEach((item, index) => {
        if (item.value) {
            if (item.operator === 'LIKE') {
                where.push(`${item.name} ${item.operator} @param${index}`);
                queryParams.push({ name: `param${index}`, type: sql.NVarChar, value: item.value });
            } else {
                where.push(`${item.name} ${item.operator} @param${index}`);
                queryParams.push({ name: `param${index}`, type: sql[item.name.startsWith('YEAR') ? 'Int' : 'NVarChar'], value: item.value });
            }
        }
    });

    if (blackWhite === 'true') {
        where.push('qp.black_white > 0');
    }

    if (color === 'true') {
        where.push('qp.color > 0');
    }

    let whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let sqlQuery = `
        SELECT r.*, 
               qp.black_white AS blackWhite,
               qp.color AS color, 
               (qp.black_white + qp.color) AS sumRound,
               SUM(qp.black_white + qp.color) OVER (PARTITION BY r.requester, YEAR(r.deliveryDate)) AS sumUserYear,
               rs.requestStatus AS requestStatus,
               rt.requestTypeName,
               st.subjectTypeName,
               p.priorityName,
               YEAR(r.deliveryDate) AS year
        FROM QuotaPrint qp
        INNER JOIN Request r ON r.requestID = qp.requestID
        INNER JOIN RequestType rt ON rt.requestTypeID = r.requestTypeID
        INNER JOIN SubjectType st ON st.subjectTypeID = r.subjectTypeID
        INNER JOIN RequestStatus rs ON rs.requestStatusID = r.requestStatusID
        INNER JOIN Priority p ON p.priorityID = r.priorityID
        ${whereClause}
        ORDER BY r.requestNo DESC
    `;

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/sumYear", async function (req, res, next) {
    const year = req.query.year;

    let sqlQuery = `SELECT YEAR(r.deliveryDate) AS year, 
                            SUM(qp.black_white) AS totalBlackWhite, 
                            SUM(qp.color) AS totalColor
                    FROM QuotaPrint qp
                    INNER JOIN Request r ON r.requestID = qp.requestID
                    WHERE 1=1`;

    let queryParams = [];
    
    if (year) {
        sqlQuery += ` AND YEAR(r.deliveryDate) = @year`;
        queryParams.push({ name: 'year', type: sql.Int, value: parseInt(year) });
    }

    sqlQuery += ` GROUP BY YEAR(r.deliveryDate)
                  ORDER BY Year DESC;`;

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/sumUser", async function (req, res, next) {
    const year = req.query.year;

    let sqlQuery = `SELECT YEAR(r.deliveryDate) AS year, 
                            r.requester,
                            SUM(qp.black_white + qp.color) AS sumUserYear
                    FROM QuotaPrint qp
                    INNER JOIN Request r ON r.requestID = qp.requestID
                    WHERE 1=1`;

    let queryParams = [];
    
    if (year) {
        sqlQuery += ` AND YEAR(r.deliveryDate) = @year`;
        queryParams.push({ name: 'year', type: sql.Int, value: parseInt(year) });
    }

    sqlQuery += ` GROUP BY r.requester, YEAR(r.deliveryDate)
                  ORDER BY year DESC;`;

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/sumBorrow", async function (req, res, next) {
    const year = req.query.year;

    let sqlQuery = `SELECT YEAR(r.deliveryDate) AS year, 
                            r.requester,
                            COUNT(r.requester) AS sumUserYear
                    FROM BorrowNotebook bn
                    INNER JOIN Request r ON r.requestID = bn.requestID
                    WHERE 1=1`;

    let queryParams = [];
    
    if (year) {
        sqlQuery += ` AND YEAR(r.deliveryDate) = @year`;
        queryParams.push({ name: 'year', type: sql.Int, value: parseInt(year) });
    }

    sqlQuery += ` GROUP BY r.requester, YEAR(r.deliveryDate)
                  ORDER BY year DESC;`;

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/status", async function (req, res, next) {
    try {
        const data = await connectAndQuery(`SELECT rs.requestStatus
                                            FROM 
                                                RequestStatus rs;`);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/borrowList", async function (req, res, next) {
    const {
        year,
        division,
        requester,
        borrowStartDate,
        borrowEndDate,
        status,
        borrowStatus,
        location
    } = req.query;
    
    let conditions = [
        { name: 'YEAR(r.deliveryDate)', value: year, operator: '=' },
        { name: 'LOWER(r.divisionName)', value: division && division.toLowerCase(), operator: '=' },
        { name: 'LOWER(r.requester)', value: requester && `%${requester.toLowerCase()}%`, operator: 'LIKE' },
        { name: 'LOWER(rs.requestStatus)', value: status && status.toLowerCase(), operator: '=' },
        { name: 'LOWER(bs.borrowStatusName)', value: borrowStatus && borrowStatus.toLowerCase(), operator: '=' },
        { name: 'LOWER(l.locationName)', value: location && location.toLowerCase(), operator: '=' },
        { name: 'bn.borrowStartDate', value: borrowStartDate, operator: '>=' },
        { name: 'bn.borrowEndDate', value: borrowEndDate, operator: '<=' }
    ];

    let where = [];
    let queryParams = [];

    conditions.forEach((item, index) => {
        if (item.value) {
            if (item.operator === 'LIKE') {
                where.push(`${item.name} ${item.operator} @param${index}`);
                queryParams.push({ name: `param${index}`, type: sql.NVarChar, value: item.value });
            } else {
                where.push(`${item.name} ${item.operator} @param${index}`);
                queryParams.push({ name: `param${index}`, type: sql[item.name.startsWith('YEAR') ? 'Int' : 'NVarChar'], value: item.value });
            }
        }
    });

    let whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let sqlQuery = `
        SELECT bn.*,
               r.requestNo,
               r.requester,
               r.divisionName,
               r.ownerJob,
               r.deliveryDate,
               r.requestDetail,
               p.priorityName,
               rs.requestStatus,
               bs.borrowStatusName,
               rt.requestTypeName,
               st.subjectTypeName,
               st.subjectTypeID,
               l.locationName,
               YEAR(r.deliveryDate) AS year
        FROM BorrowNotebook bn
        INNER JOIN Request r ON r.requestID = bn.requestID
        INNER JOIN Priority p ON p.priorityID = r.priorityID
        INNER JOIN Location l ON l.locationID = bn.locationID
        INNER JOIN RequestType rt ON rt.requestTypeID = r.requestTypeID
        INNER JOIN SubjectType st ON st.subjectTypeID = r.subjectTypeID
        INNER JOIN BorrowStatus bs ON bs.borrowStatusID = bn.borrowStatusID
        INNER JOIN RequestStatus rs ON rs.requestStatusID = r.requestStatusID
        ${whereClause}
        ORDER BY r.requestNo DESC
    `;

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



app.get("/api/borrowStatus", async function (req, res, next) {
    try {
        const data = await connectAndQuery(`SELECT bs.borrowStatusName
                                            FROM 
                                                BorrowStatus bs;`);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/location", async function (req, res, next) {
    try {
        const data = await connectAndQuery(`SELECT l.locationName
                                            FROM 
                                                Location l`);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/all", async function (req, res, next) {
    const { year, 
        division, 
        requester, 
        requestTypeName, 
        startDate, 
        endDate, 
        status, 
        ownerJob,
        deliveryDate
    } = req.query;

    let conditions = [
        { name: 'YEAR(r.deliveryDate)', value: year, operator: '=' },
        { name: 'LOWER(r.divisionName)', value: division && division.toLowerCase(), operator: '=' },
        { name: 'LOWER(r.requester)', value: requester && `%${requester.toLowerCase()}%`, operator: 'LIKE' },
        { name: 'LOWER(rt.requestTypeName)', value: requestTypeName && requestTypeName.toLowerCase(), operator: '=' },
        { name: 'LOWER(r.ownerJob)', value: ownerJob && ownerJob.toLowerCase(), operator: '=' },
        { name: 'r.deliveryDate', value: deliveryDate, operator: '=' },
        { name: 'r.requestDateStart', value: startDate, operator: '>=' },
        { name: 'r.requestDateEnd', value: endDate, operator: '<=' },
        { name: 'LOWER(rs.requestStatus)', value: status && status.toLowerCase(), operator: '=' }
    ];

    let where = [];
    conditions.forEach((item) => {
        if (item.value) {
            where.push(`${item.name} ${item.operator} '${item.value}'`);
        }
    });

    let whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    let sqlQuery = `
        SELECT r.requestNo,
               r.requestID,
               r.requester,
               r.ownerJob,
               r.deliveryDate,
               r.requestDetail,
               r.divisionName,
               r.requestDateStart,
               r.requestDateEnd,
               p.priorityName,
               rs.requestStatus,     
               rt.requestTypeName,
               st.subjectTypeName,
               st.subjectTypeID,
               YEAR(r.deliveryDate) AS year
        FROM Request r
        INNER JOIN Priority p ON p.priorityID = r.priorityID
        INNER JOIN RequestType rt ON rt.requestTypeID = r.requestTypeID
        INNER JOIN SubjectType st ON st.subjectTypeID = r.subjectTypeID
        INNER JOIN RequestStatus rs ON rs.requestStatusID = r.requestStatusID
        ${whereClause}
        ORDER BY r.requestNo DESC
    `;

    try {
        const data = await connectAndQuery(sqlQuery);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/requestType", async function (req, res, next) {
    try {
        const data = await connectAndQuery(`SELECT rt.requestTypeName
                                            FROM 
                                                RequestType rt`);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/ownerJob", async function (req, res, next) {
    try {
        const data = await connectAndQuery(`SELECT r.ownerJob
                                            FROM 
                                                Request r
											GROUP BY r.ownerJob`);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/searchMain", async function (req, res, next) {
    const searchText = req.query.searchText;
    const year = req.query.year;

    try {
        const query = `
            SELECT *
            FROM Request r
            INNER JOIN Priority p ON p.priorityID = r.priorityID
            INNER JOIN RequestType rt ON rt.requestTypeID = r.requestTypeID
            INNER JOIN SubjectType st ON st.subjectTypeID = r.subjectTypeID
            INNER JOIN RequestStatus rs ON rs.requestStatusID = r.requestStatusID
            WHERE (r.requestNo LIKE @searchText
                OR r.requester LIKE @searchText
                OR r.ownerJob LIKE @searchText
                OR r.deliveryDate LIKE @searchText
                OR r.requestDetail LIKE @searchText
                OR r.divisionName LIKE @searchText
                OR r.requestDateStart LIKE @searchText
                OR r.requestDateEnd LIKE @searchText
                OR p.priorityName LIKE @searchText
                OR rs.requestStatus LIKE @searchText
                OR rt.requestTypeName LIKE @searchText
                OR st.subjectTypeName LIKE @searchText
                OR CAST(YEAR(r.deliveryDate) AS VARCHAR) LIKE @searchText)
            ${year ? 'AND YEAR(r.deliveryDate) = @year' : ''}
            ORDER BY r.requestNo DESC
        `;

        const params = [
            { name: 'searchText', type: sql.NVarChar, value: `%${searchText}%` },
            ...(year ? [{ name: 'year', type: sql.Int, value: parseInt(year, 10) }] : [])
        ];

        const data = await connectAndQuery(query, params);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get("/api/searchQuota", async function (req, res, next) {
    const searchText = req.query.searchText;
    const year = req.query.year;

    try {

        const query = `
            SELECT r.*, 
                qp.black_white AS blackWhite,
                qp.color AS color, 
                (qp.black_white + qp.color) AS sumRound,
                SUM(qp.black_white + qp.color) OVER (PARTITION BY r.requester, YEAR(r.deliveryDate)) AS sumUserYear,
                rs.requestStatus AS requestStatus,
                rt.requestTypeName,
                st.subjectTypeName,
                p.priorityName,
                YEAR(r.deliveryDate) AS year
            FROM QuotaPrint qp
            INNER JOIN Request r ON r.requestID = qp.requestID
            INNER JOIN RequestType rt ON rt.requestTypeID = r.requestTypeID
            INNER JOIN SubjectType st ON st.subjectTypeID = r.subjectTypeID
            INNER JOIN RequestStatus rs ON rs.requestStatusID = r.requestStatusID
            INNER JOIN Priority p ON p.priorityID = r.priorityID
            WHERE (r.requestNo LIKE @searchText
                OR r.requester LIKE @searchText
                OR r.ownerJob LIKE @searchText
                OR r.deliveryDate LIKE @searchText
                OR r.requestDetail LIKE @searchText
                OR r.divisionName LIKE @searchText
                OR r.requestDateStart LIKE @searchText
                OR r.requestDateEnd LIKE @searchText
                OR p.priorityName LIKE @searchText
                OR rs.requestStatus LIKE @searchText
                OR rt.requestTypeName LIKE @searchText
                OR st.subjectTypeName LIKE @searchText
                OR CAST(YEAR(r.deliveryDate) AS VARCHAR) LIKE @searchText)
            ${year ? 'AND YEAR(r.deliveryDate) = @year' : ''}
            ORDER BY r.requestNo DESC
        `;

        const params = [
            { name: 'searchText', type: sql.NVarChar, value: `%${searchText}%` },
            ...(year ? [{ name: 'year', type: sql.Int, value: parseInt(year, 10) }] : [])
        ];

        const data = await connectAndQuery(query, params);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get("/api/searchBorrow", async function (req, res, next) {
    const searchText = req.query.searchText;
    const year = req.query.year;

    console.log('searchText:', searchText);
    console.log('year:', year);

    try {
        let query = `
            SELECT bn.*,
               r.requestNo,
               r.requester,
               r.divisionName,
               r.ownerJob,
               r.deliveryDate,
               r.requestDetail,
               p.priorityName,
               rs.requestStatus,
               bs.borrowStatusName,
               rt.requestTypeName,
               st.subjectTypeName,
               l.locationName,
               YEAR(r.deliveryDate) AS year
            FROM BorrowNotebook bn
            INNER JOIN Request r ON r.requestID = bn.requestID
            INNER JOIN Priority p ON p.priorityID = r.priorityID
            INNER JOIN Location l ON l.locationID = bn.locationID
            INNER JOIN RequestType rt ON rt.requestTypeID = r.requestTypeID
            INNER JOIN SubjectType st ON st.subjectTypeID = r.subjectTypeID
            INNER JOIN BorrowStatus bs ON bs.borrowStatusID = bn.borrowStatusID
            INNER JOIN RequestStatus rs ON rs.requestStatusID = r.requestStatusID
            WHERE (r.requestNo LIKE @searchText
                OR r.requester LIKE @searchText
                OR r.ownerJob LIKE @searchText
                OR r.deliveryDate LIKE @searchText
                OR r.requestDetail LIKE @searchText
                OR r.divisionName LIKE @searchText
                OR bn.borrowStartDate LIKE @searchText
                OR bn.borrowEndDate LIKE @searchText
                OR p.priorityName LIKE @searchText
                OR rs.requestStatus LIKE @searchText
                OR rt.requestTypeName LIKE @searchText
                OR st.subjectTypeName LIKE @searchText
                OR l.locationName LIKE @searchText
                OR bs.borrowStatusName LIKE @searchText
                OR bn.asset LIKE @searchText)
            ${year ? 'AND YEAR(r.deliveryDate) = @year' : ''}
            ORDER BY r.requestNo DESC
        `;

        const params = [
            { name: 'searchText', type: sql.NVarChar, value: `%${searchText}%` },
            ...(year ? [{ name: 'year', type: sql.Int, value: parseInt(year, 10) }] : [])
        ];        

        const data = await connectAndQuery(query, params);
        
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/viewDetailQuota", async function (req, res, next) {
    const requestID = req.query.requestID;

    let sqlQuery = `SELECT 
                            qp.black_white, 
                            qp.color
                    FROM QuotaPrint qp
                    WHERE 1=1`;

    let queryParams = [];
    
    if (requestID) {
        sqlQuery += ` AND qp.requestID = @requestID`;
        queryParams.push({ name: 'requestID', type: sql.Int, value: parseInt(requestID) });
    }

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get("/api/viewDetailBorrow", async function (req, res, next) {
    const requestID = req.query.requestID;

    let sqlQuery = `SELECT bn.asset, 
                            bs.borrowStatusID
                    FROM BorrowNotebook bn
                    INNER JOIN BorrowStatus bs ON bs.borrowStatusID = bn.borrowStatusID
                    WHERE 1=1`;

    let queryParams = [];
    
    if (requestID) {
        sqlQuery += ` AND bn.requestID = @requestID`;
        queryParams.push({ name: 'requestID', type: sql.Int, value: parseInt(requestID) });
    }

    try {
        const data = await connectAndQuery(sqlQuery, queryParams);
        res.json(data);
    } catch (error) {
        console.error('Error querying database:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
