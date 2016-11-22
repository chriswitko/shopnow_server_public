angular.module('filters', [])
.filter('nearestK', function() {
    return function(input) {
      if (typeof input==="undefined") {
        return;
      } else {
        input = input+'';    // make string
        if (input < 1000) {
          return input;      // return the same number
        }
        if (input < 10000) { // place a comma between
          return input.charAt(0) + ',' + input.substring(1);
        }

        // divide and format
        return (input/1000).toFixed(input % 1000 !== 0)+'k';
      }
    };
})

.filter('join', function () {
    return function join(array, separator, prop) {
        if (!Array.isArray(array)) {
            return array; // if not array return original - can also throw error
        }

        return (!!prop ? array.map(function (item) {
            return item[prop];
        }) : array).join(separator);
    };
})

.filter('lzero', function() {
  return function(s, len) {
    return ('0' + s).slice(-2);
  };
})

.filter('formatTargeting', function() {
  return function(targeting) {
    // delete targeting.gender[targeting.gender.indexOf('unknown')];
    var gender = targeting.gender.join(', ').replace(', unknown', '');
    var age = targeting.age_from.toString() + ' - ' + targeting.age_to.toString().replace('100', '65+');
    return gender + ', ' + age;
  };
})

.filter('adStatusTxt', function() {
  return function(s) {
    var status = 'Draft';
    switch(s) {
      case 'draft':
        status = 'Draft';
        break;
      case 'ready':
        status = 'Queued';
        break;
      case 'ready':
        status = 'Queued';
        break;
      case 'live':
        status = 'Live';
        break;
      default:
        break;  
    }
    return status;
  };
})



.filter('ages', function() {
  return function(input, total) {
    total = parseInt(total, 10);

    for (var i = 13; i <= total; i++) {
      if(i == 65) {
        input.push({v: 100, n: '65+'});
    } else {
        input.push({v: i, n: i});
      }
    }

    return input;
  };
})

.filter('hours', function() {
  return function(input, total) {
    total = parseInt(total, 10);

    for (var i = 0; i < total; i++) {
      input.push({v: ('0' + i).slice(-2), n: ('0' + i).slice(-2)});
    }

    return input;
  };
})

.filter('minutes', function() {
  return function(input, total) {
    total = parseInt(total, 10);

    input.push({v: '0', n: '00'});
    input.push({v: '15', n: '15'});
    input.push({v: '30', n: '30'});
    input.push({v: '45', n: '45'});

    return input;
  };
})

.filter('years', function() {
  return function(input, total) {
    total = parseInt(total, 10);
    var now = new Date();
    var year = now.getFullYear();
    if(now.getMonth() >= 10) {
      year = year + 1;
    }

    for (var i = now.getFullYear(); i <= year; i++) {
      input.push({v: i.toString(), n: i.toString()});
    }

    return input;
  };
})

.filter('months', function() {
  return function(input, total) {
    total = parseInt(total, 10);

    for (var i = 1; i <= 12; i++) {
      input.push({v: ('0' + i).slice(-2), n: ('0' + i).slice(-2)});
    }

    return input;
  };
})

.filter('days', function() {
  return function(input, total) {
    total = parseInt(total, 10);

    for (var i = 1; i <= 31; i++) {
      input.push({v: ('0' + i).slice(-2), n: ('0' + i).slice(-2)});
    }

    return input;
  };
})

.filter('campaignType', function() {
  return function(input) {
    if (input === 'regular') {
      return 'Regular';
    } else if (input === 'hotdeal') {
      return 'Hot Deal';
    } else {
      return 'Regular';
    }
  };
})


.filter('campaignTypeTitle', function() {
  return function(input) {
    if (input === 'regular') {
      return 'Regular Campaign';
    } else if (input === 'hotdeal') {
      return 'Hot Deal Campaign';
    } else if (input === 'banner') {
      return 'Banner Campaign';
    } else if (input === 'filter') {
      return 'Live Filter Campaign';
    } else {
      return 'Regular Campaign';
    }
  };
})

.filter('formatGender', function() {
  return function(input) {
    if (input === 'all') {
      return 'All';
    } else if (input === 'male') {
      return 'Male only';
    } else if (input === 'female') {
      return 'Female only';
    }
  };
})

.filter('formatAge', function() {
  return function(input) {
    if (input === '13 - 100') {
      return 'All';
    } else {
      return input.replace('100', '65+');
    }
  };
})

.filter('currencySymbolBefore', function() {
  return function(input) {
    if (input === 'GBP') {
      return '£';
    } else if (input === 'EUR') {
      return '€';
    } else if (input === 'USD') {
      return '$';
    } else {
      return '';
    }
  };
})

.filter('currencySymbolAfter', function() {
  return function(input) {
    if (input === 'PLN') {
      return 'zł';
    } else if (input === '%') {
      return '%';
    } else {
      return '';
    }
  };
})

.filter('capitalize', function() {
  return function(input, scope) {
    if (input !== null) {
      input = input.toLowerCase();
    }
    return input.substring(0,1).toUpperCase()+input.substring(1);
  };
})

.filter('tz', function() {
    return function(dateString, timezone, format) {
      return moment.tz(new Date(dateString), timezone).format(format);
    };
})

;