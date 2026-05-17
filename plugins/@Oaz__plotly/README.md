# SliDesk Plugin: Plotly

This plugin allows you to add `Plotly` grapĥs in your slides.

```
    ```plotly
    [
        {
            x: [1, 2, 3, 4, 5],
            y: [1, 4, 9, 16, 25],
            type: 'scatter',
            mode: 'lines+markers'
        }
    ]
    ```
```

You can also define the layout of the graph.

```
    ```plotly
    {
        data: [
            {
                x: ['Apples', 'Oranges', 'Bananas', 'Grapes'],
                y: [20, 15, 30, 25],
                type: 'bar',
                marker: {
                    color: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0']
                }
            }
        ],
        layout: {
            title: { text: 'Fruit Sales' },
            xaxis: { title: { text: 'Fruit Type' } },
            yaxis: { title: { text: 'Quantity Sold' } },
            height: 600
        }
    }
    ``` 
```

Any valid JavaScript can be used to generate the graph.

```
    ```plotly
    async function() {
        const response = await fetch('https://jsonplaceholder.typicode.com/todos');
        const todos = await response.json();
        const completed = todos.filter(todo => todo.completed).length;
        const pending = todos.filter(todo => !todo.completed).length;
        return {
            data: [{
                values: [completed, pending],
                labels: ['Completed', 'Pending'],
                type: 'pie',
                marker: {
                    colors: ['#2ca02c', '#d62728']
                },
                textinfo: 'label+percent',
            }],
            layout: {
                title: {text: 'Todo Completion Status'},
                height: 800
            }
        };
    }
    ```
```

The graph can be automatically refreshed.

```
    ```plotly
    {
       data: [{
           x: [1, 2, 3, 4],
           y: [Math.random(), Math.random(), Math.random(), Math.random()],
           type: 'scatter'
       }],
       repeat: 500  // Refresh every 500 milliseconds
    }
    ```
```

Additional data can be stored in a state object and reused/updated on each refresh.
The state object is _not_ persisted between slides.

```
    ```plotly
    function(state) {
        size = 30;
        if (state.y) {
            const lastX = state.x[state.x.length - 1];
            state.x.push(lastX + 1);
            state.y.push(Math.random());
        } else {
            state.x = Array.from({length: size}, (_, i) => i + 1);
            state.y = Array.from({length: size}, () => Math.random());
        }
        if (state.x.length > size) {
            state.x = state.x.slice(-size);
            state.y = state.y.slice(-size);
        }
        return {
          data: [{
              x: state.x,
              y: state.y,
              type: 'scatter'
          }],
          layout: {
            width: 1500
          },
          repeat: 500,
          state: state
       };
    }
    ```
```

See the [Plotly documentation](https://plotly.com/javascript/) for more information.
