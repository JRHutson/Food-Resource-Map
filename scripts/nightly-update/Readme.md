# Update features in ArcGIS Online

### Background

This script parses `../AgencyList/AgencyList.csv` and uses what it finds to send our ArcGIS Online food bank distribution dataset information for the next 48 hours.

### Setup
```
cd ../scripts/nightly-update/
npm install
...
npm start
```

### To do
- [x] update feature service with yes/no information for tomorrow's distributions
- [x] use local time (instead of GMT)
- [ ] add more logic to transfer detailed hourly information for today
- [ ] write a method to reset *all* feature attributes
- [ ] schedule the script to run at 12:01am each day

### edge cases
- [ ] bi-weekly or otherwise alternate schedules

### edge edge cases
- [ ] distribution address doesn't match agency address
- [ ] alternate schedule described in 'comments' instead of 'frequency'
