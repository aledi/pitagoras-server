# Pitagoras Server

# Requirements
* Node 2.14.4 or above

# User guide
1. Clone `pitagoras-server` from github repository.
2. Add fallback values in `index.js`
3. Open a terminal window on project folder.
4. Run `npm run start` command.

# Environment variables
1. Open a terminal window.
2. Run `open ~/.bash_profile` command.
3. Copy this text at the bottom of the file

```
#  ----------------------------------
#    PITAGORAS ENV VARIABLES
#  ----------------------------------

export MASTER_KEY=masterKeyValue
```

4. Go to `Settings` tab in Herouku app.
5. On `Config variables` section, click in `Reveal Config Vars` and copy the value for `MASTER_KEY` variable.
6. Replace `masterKeyValue` with the value you just copied.
7. Save and close `bash_profile` file.
8. Run `source ~/.bash_profile` command.

# Dashboard
1. Open a terminal window on project folder.
2. Run `./dashboard.sh` command.
3. Open your web browser and go to `localhost:4040`.
