# CHANGELOG

## [1.6.10] 
### FEATURES
- Added logging module in `/helpers`, convert `console.log` to `log(LogLevel.INFO,...`
### BUGFIXES
- Fix ActorIsPC Deprecated

## [1.6.9] 
### RESTRUCTURE
- Added build tools from [Foundry Project Creator](https://gitlab.com/foundry-projects/foundry-pc/create-foundry-project)
- Remove redundant packages. 
- Restructure file folders for src and dist.

## [1.6.8] 
### BUGFIXES
- fix bug when token is created and not moved before update 
- (moved setFlag to createTokenHandler)

## [1.6.7] 2020-09-19
### BUGFIXES
- fixed reload direction, part 2
- fixed flip issue
- addressed a performance issue
- fixed issue where new token required refresh; thanks to @BlitzKraig

## [1.6.7] 2020-08-02
### BUGFIXES
- fixed problem where directions would reset on reload
- fixed mirror token issue


## [1.6.6] 2020-08-02
### BUGFIXES
- corrected some directional stuff
- fixed problem with token vision

### KNOWN ISSUES
- performance seems to be .. not great and needs optimized. =(

## [1.6.5] 2020-07-19
### ADDED
- Portugese Support! -- thanks to @HonzoNebro
- Castilian Support! -- thanks to @HonzoNebro
### BUGFIXES
- resolved issue with tokens jumping when using Horizontal flip
- fixed pesky bug causing a delay in updates


## [1.6.3] 2020-07-05
### BUGFIXES
- corrected issue attempting to hide non-registered sprites

## [1.0.6] 2020-07-04
### BUGFIXES
- corrected issue with indicator color at startup


## [1.0.6] 2020-06-21

### BUGFIXES
- corrected issue with actors not being associated with tokens


## [1.0.5] 2020-06-18

### ADDED
- Vertical and Horizontal flip token options (doesn't work with Indicators)
- Added larger indicator option
- Backend support for multiple graphics indicators

## [1.0.3] 2020-06-18

### BUGFIXES

## [1.0.2] 2020-06-18

### BUGFIXES

## [1.0.1] 2020-06-18

### ADDED
- Indicators to show facing direction
- Indicator Options
- Ability to change direction w/o moving using SHIFT.



## [1.0.0] 2020-06-13

### ADDED

- Initial Release
- Tokens rotate "facing" based on movement