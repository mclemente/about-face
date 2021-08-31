export default [
  {}, //gridless
  { //square
      'flip-v': {
          down: {
              mirror: 'mirrorY',
              0: true,
              180: false
          },
          up: {
              mirror: 'mirrorY',
              0: false,
              180: true
          }
      },
      'flip-h': {
          right: {
              mirror: 'mirrorX',
              90: true,
              270: false
          },
          left: {
              mirror: 'mirrorX',
              90: false,
              270: true
          }
      },
  }, 
  { //hex odd rows
      'flip-v': {
          down: {
              mirror: 'mirrorY',
              45: false,
              135: true,
              225: true,
              315: false,                              
          },
          up: {
              mirror: 'mirrorY',
              45: true,
              135: false,
              225: false,
              315: true,  
          }
      },
      'flip-h': {
          right: {
              mirror: 'mirrorX',
              90: true,
              270: false
          },
          left: {
              mirror: 'mirrorX',
              90: false,
              270: true
          }
      },
  },
  { //hex even rows
      'flip-v': {
          down: {
              mirror: 'mirrorY',
              45: false,
              135: true,
              225: true,
              315: false,                              
          },
          up: {
              mirror: 'mirrorY',
              45: true,
              135: false,
              225: false,
              315: true,  
          }
      },
      'flip-h': {
          right: {
              mirror: 'mirrorX',
              90: true,
              270: false
          },
          left: {
              mirror: 'mirrorX',
              90: false,
              270: true
          }
      },
  },
  { //hex odd cols
      'flip-v': {
          down: {
              mirror: 'mirrorY',
              0: false,
              180: true                                
          },
          up: {
              mirror: 'mirrorY',
              0: true,
              180: false
          }
      },
      'flip-h': {
          right: {
              mirror: 'mirrorX',
              60: true,
              120: true,
              240: false,
              300: false,
          },
          left: {
              mirror: 'mirrorX',
              60: false,
              120: false,
              240: true,
              300: true,
          }
      },
  }, 
  { // hex even cols
      'flip-v': {
          down: {
              mirror: 'mirrorY',
              0: false,
              180: true                                
          },
          up: {
              mirror: 'mirrorY',
              0: true,
              180: false
          }
      },
      'flip-h': {
          right: {
              mirror: 'mirrorX',
              60: true,
              120: true,
              240: false,
              300: false,
          },
          left: {
              mirror: 'mirrorX',
              60: false,
              120: false,
              240: true,
              300: true,
          }
      },
  } 
];