/**
* Copyright © 2019 code initially contributed by Orange SA, authors: Denis Barbaron - Licensed under the Apache license 2.0
**/

module.exports = function ItemsPerPageOptionsServiceFactory() {
  const service = [
    {name: '1', value: 1}
  , {name: '5', value: 5}
  , {name: '10', value: 10}
  , {name: '20', value: 20}
  , {name: '50', value: 50}
  , {name: '100', value: 100}
  , {name: '200', value: 200}
  , {name: '500', value: 500}
  , {name: '1000', value: 1000}
  , {name: '*', value: 0}
  ]

  return service
}

