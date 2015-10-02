/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved. 
 *   MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *   
 *  The above copyright notice and this permission notice shall be included in 
 *  all copies or substantial portions of the Software.
 *   
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/// <reference path="../../_references.ts"/>

module powerbi.visuals.samples {
    import SelectionManager = utility.SelectionManager;
    export interface GanttViewModel {
        text: string;
        color: string;
        size: number;
        selector: SelectionId;
        toolTipInfo: TooltipDataItem[];
    }

    export class GanttChart implements IVisual {
        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: 'Values',
                kind: VisualDataRoleKind.GroupingOrMeasure
            }],
            dataViewMappings: [{
                table: {
                    rows: {
                        for: { in: 'Values' },
                        dataReductionAlgorithm: { window: { count: 100 } }
                    },
                    rowCount: { preferred: { min: 1 } }
                },
            }],
            
        };

        
        private static DefaultText = 'Invalid DV';
        private root: D3.Selection;
        private svgText: D3.Selection;
        private dataView: DataView;
        private selectiionManager: SelectionManager;
        private xScale: any;
        private yScale: any;
        private yAxis: any;
        private yAxisGroup: any;
        private nowDate: any;
        private margin: any;
        
        private chartGroup: D3.Selection;
        private progressGroup: D3.Selection;
        private taskGroup: D3.Selection;
        private milestoneGroup: D3.Selection;
        private labelGroup: D3.Selection;
        private lineGroup: D3.Selection;
        
        private nowLine: D3.Selection;
        private milestoneShapes: D3.Selection;
        private taskBars: D3.Selection;
        private progressBars: D3.Selection;
        
        private tasks: any;
        
        
        public static converter(dataView: DataView): GanttViewModel {
            var viewModel: GanttViewModel = {
                size: GanttChart.getSize(dataView),
                color: GanttChart.getFill(dataView).solid.color,
                text: "test",
                toolTipInfo: [{
                    displayName: 'Test',
                    value: 'working',
                }],
                selector: SelectionId.createNull()
            };
            var table = dataView.table;
            if (!table) return viewModel;

            viewModel.text = table.rows[0][0];
            if (dataView.categorical) {
                viewModel.selector = dataView.categorical.categories[0].identity
                    ? SelectionId.createWithId(dataView.categorical.categories[0].identity[0])
                    : SelectionId.createNull();
            }

            return viewModel;
        }

        
        private updateZoomTimeline():void{
            
        }
        
        public init(options: VisualInitOptions): void {
            this.root = d3.select(options.element.get(0))
                .append('svg')
                .classed('ganttChart', true);
            
            var svg = this.root;
            
            this.xScale = d3.scale.linear();
            this.yScale = d3.time.scale();
            svg.style('font-size', 10);
                    
            this.yAxis = d3.svg.axis()
                .orient("right")
                .orient("bottom");
            
            this.yAxisGroup = this.root.append("g")
                                .attr("class", "y axis");
        
            this.chartGroup = this.root.append("g").attr("class", "chart")
            this.taskGroup = this.chartGroup.append("g").attr("class", "tasks");
            this.progressGroup  = this.chartGroup.append("g").attr("class", "task_progress");
            this.milestoneGroup = this.chartGroup.append("g").attr("class", "milestones");
            this.labelGroup = this.root.append("g").attr("class", "task_labels");                     
            this.lineGroup = this.root.append("g").attr("class","task_lines");
            
            this.selectiionManager = new SelectionManager({ hostServices: options.host });
            
            this.margin = {top: 30, right: 80, bottom: 40, left: 90};
            
        }

        
        private taskProgress(task: any): any{
            var progress = (parseInt(task.completion)/100)
            var y = this.yScale;
            return (y(new Date(task.endDate))-y(new Date(task.startDate)))*progress;
        }
        
        
        private getMilestone(): any{
            var arc = d3.svg.symbol().type('triangle-up').size(80);
            return arc;
        }
        
        private  getMilestonePos(task: any): any{
            var transform = "translate(" + this.yScale(new Date(task.startDate)) +"," + this.xScale(parseInt(task.ID) - 0.5) + ")";
            return transform;
        }
        
        
        private taskDurationToWidth(task:any): number{
            var width = this.yScale(new Date(task.endDate)) - this.yScale(new Date(task.startDate));
            return width;
        }
        
        private updateTaskBars(tasks: any): void{
               this.taskGroup.selectAll("rect").remove();
               this.taskBars = this.taskGroup.selectAll("rect")
                .data(tasks.filter(function(task) {return task.shape==="none"}))
                .enter()
                .append("rect")
                   .attr("x", (task:any, i) => this.yScale(new Date(task.startDate)))
                   .attr("y", (task:any, i) => this.xScale(parseInt(task.ID) - 1))
                   .attr("width", (task:any, i) => this.taskDurationToWidth(task))
                .attr("height",30)
                .style("fill", "none")
                .style("stroke", "black");
        }
        
        
        private updateProgressBars(tasks: any): void{
            this.progressGroup.selectAll("rect").remove();    
            this.progressBars = this.progressGroup.selectAll("rect")
                .data(tasks.filter(function(task) {return task.shape==="none"}))
                .enter()
                .append("rect")
                .attr("x", (task:any, i) => this.yScale(new Date(task.startDate)))
                .attr("y", (task:any, i) => this.xScale(parseInt(task.ID) - 1))
                .attr("width", (task : any, i) =>  this.taskProgress(task))
                .attr("height",30)
                .style("fill", function(task) {return task.color});  
        }
        
        
        private updateMilestoneShapes(tasks:any): void{
            this.milestoneGroup.selectAll("path").remove();    
            this.milestoneShapes = this.milestoneGroup.selectAll("path")
                        .data(tasks.filter(function(task) {return task.shape!="none"}))
                        .enter()
                        .append("path")
                        .attr('d', this.getMilestone())
                        .attr("transform", (task:any, i) => this.getMilestonePos(task))
                        .style("fill", function(task) {return task.color});    
        }
        
        private updateNowLine(tasks:any): void{
            this.chartGroup.selectAll("line").remove();    
            this.nowLine = this.chartGroup.append("line")
                    .attr("x1",  this.yScale(new Date(this.nowDate)))   
                    .attr("y1", this.xScale(0))
                    .attr("x2",  this.yScale(new Date(this.nowDate)))
                    .attr("y2",  this.xScale(10))
                    .attr("stroke-width", 2)
                    .style("stroke-dasharray", ("3, 3"))
                    .style("stroke", "black");
        }
    
        
        private updateLabels(tasks: any): void {
            this.labelGroup.selectAll("text").remove()
            this.labelGroup.selectAll("text")
                .data(tasks)
                .enter()
                .append("text")
                .attr("class", "title")
                .attr("x", 10)
                .attr("y", (task:any, i) => this.xScale(parseInt(task.ID) - 0.5) + this.margin.top )
                .attr("fill", function(task) {return task.color})
                .attr("stroke-width", 1)
                .text(function(task) {return task.name});    
        }
        
        
        private updateTaskLines(tasks: any, width: number): void {
            this.lineGroup.selectAll("rect").remove()
            this.lineGroup.selectAll("rect")
                .data(tasks)
                .enter()
                .append("rect")
                .attr("class", "task_line")
                .attr("x", 0)
                .attr("y", (task:any, i) => this.xScale(parseInt(task.ID) - 1) + this.margin.top)
                .attr("width", width + this.margin.left + this.margin.right)
                .attr("height", 30 )
                .attr("fill", "black")
                .attr("opacity", 0.05);
                }
        
        
        public update(options: VisualUpdateOptions) {
                var tasks = [{"color":"green","name":"Task 1","ID":1,"startDate":"2014-12-31T10:00:00.000Z","shape":"none","endDate":"2014-12-31T23:00:00.000Z","resource":"Amir","group":"Microsoft","d":"A","completion":"80","t":0},{"color":"blue","name":"Task 2","ID":2,"startDate":"2014-12-31T23:00:00.000Z","shape":"none","endDate":"2015-01-02T23:00:00.000Z","resource":"Amir","group":"Microsoft","d":"B","completion":"70","t":48},{"color":"black","name":"specs","ID":3,"startDate":"2015-01-02T23:00:00.000Z","shape":"triangle","endDate":"2015-01-04T23:00:00.000Z","resource":"Joerg","group":"freelancer","d":"A","completion":"100","t":48},{"color":"blue","name":"Task 4","ID":4,"startDate":"2015-01-02T23:00:00.000Z","shape":"none","endDate":"2015-01-07T23:00:00.000Z","resource":"Joerg","group":"freelancer","d":"B","completion":"100","t":72},{"color":"green","name":"Task 5","ID":5,"startDate":"2015-01-07T23:00:00.000Z","shape":"none","endDate":"2015-01-09T23:00:00.000Z","resource":"Amir","group":"Microsoft","d":"C","completion":"10","t":48},{"color":"blue","name":"Task 6","ID":6,"startDate":"2015-01-09T23:00:00.000Z","shape":"none","endDate":"2015-01-10T23:00:00.000Z","resource":"Amir","group":"Microsoft","d":"A","completion":"80","t":24},{"color":"red","name":"task 7","ID":7,"startDate":"2015-01-10T23:00:00.000Z","shape":"none","endDate":"2015-01-11T23:00:00.000Z","resource":"Joerg","group":"freelancer","d":"C","completion":"30","t":0},{"color":"green","name":"Task 8","ID":8,"startDate":"2015-01-11T23:00:00.000Z","shape":"none","endDate":"2015-01-12T23:00:00.000Z","resource":"Amir","group":"Microsoft","d":"C","completion":"10","t":48},{"color":"green","name":"Task 9","ID":9,"startDate":"2015-01-12T23:00:00.000Z","shape":"none","endDate":"2015-01-14T23:00:00.000Z","resource":"Amir","group":"Microsoft","d":"A","completion":"30","t":48},{"color":"black","name":"delivery","ID":10,"startDate":"2015-01-14T23:00:00.000Z","shape":"triangle","endDate":"2015-01-17T23:00:00.000Z","resource":"Joerg","group":"freelancer","d":"A","completion":"50","t":72}];
            
            
            if (!options.dataViews && !options.dataViews[0]) return;
            var dataView = this.dataView = options.dataViews[0];
            var viewport = options.viewport;
            var viewModel: GanttViewModel = GanttChart.converter(dataView);

            this.root.attr({
                'height': viewport.height,
                'width': viewport.width
            });

            
            var margin = this.margin;
            var width = viewport.width - margin.left - margin.right;
            var height = viewport.height - margin.top - margin.bottom;
                    
            
            var t1 = new Date(tasks[0].startDate);
            var t2 = new Date(tasks[9].endDate);
            
            this.xScale = this.xScale.range([0, height]).domain([0,10]);
            this.yScale = this.yScale.range([0, width]).domain([t1,t2]);    
        
            var x = this.xScale;
            var y = this.yScale;
            
            this.yAxis = this.yAxis.scale(this.yScale);
            
            
            this.root.attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
                
            this.yAxisGroup.attr("transform", "translate(" + margin.left+"," + 0 + ")")
                           .call(this.yAxis);    
            
            this.root.selectAll(".axis path").attr("fill","none");
            this.root.selectAll(".axis path").attr("stroke","#000");
            this.root.selectAll(".axis line").attr("stroke","#000");
            this.root.selectAll(".axis line").attr("shape","crispEdges");
            this.root.selectAll(".axis path").attr("shape","crispEdges");
            
            this.chartGroup.attr("transform", "translate(" + margin.left + "," + margin.top + ")");    
            
            this.updateTaskBars(tasks);
            this.updateProgressBars(tasks);
            this.updateMilestoneShapes(tasks);
            this.nowDate = new Date(tasks[4].startDate);
            this.updateNowLine(tasks);
            this.updateLabels(tasks);
            this.updateTaskLines(tasks, width);
            
            /*var zoom = d3.behavior.zoom()
                .on("zoom", this.updateZoomTimeline);
        
            zoom.x(this.yScale);
            
            this.root.append("rect")
            .attr("class", "pane")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("cursor","move")
            .attr("pointer-events","all")
            .call(zoom);    */
        
        }

        private static getFill(dataView: DataView): Fill {
            return { solid: { color: 'red' } };
        }

        private static getSize(dataView: DataView): number {
            return 100;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            return instances;
        }

        public destroy(): void {
            this.root = null;
        }
    }
}
