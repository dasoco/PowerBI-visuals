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
    
    interface taskDict { [email: string]: {[index: number]:string}; };
        
    export interface task {
        index: number,
        description: string,
        shape: string,
        resource: string
        id: string,
        group: string,
        start: Date,
        end: Date,
        completion: number,
        color: string,
        name: string,
        tooltipInfo: TooltipDataItem[]
    }
    
    export interface GanttViewModel {
        tasks: task[];
        fixedHeight: number;
        paddingLines: number;
        paddingTasks: number;
        
    }
    
    // TODO adjust capabilities
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

        
        private style: IVisualStyle;
        private root: D3.Selection;
        private viewModel: GanttViewModel;
        private svgText: D3.Selection;
        private dataView: DataView;
        private selectiionManager: SelectionManager;
        private xScale: any;
        private yScale: any;
        private yAxis: any;
        private yAxisGroup: any;
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
        private taskLines: D3.Selection;
        private tasks: any;
        
        
        /**
        * Core: init, convert and update, destroy
        */
        public init(options: VisualInitOptions): void {
            this.style = options.style;

            
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
            
            this.progressGroup  = this.chartGroup.append("g").attr("class", "task_progress");
            this.taskGroup = this.chartGroup.append("g").attr("class", "tasks");
            this.milestoneGroup = this.chartGroup.append("g").attr("class", "milestones");
            this.labelGroup = this.root.append("g").attr("class", "task_labels");                     
            this.lineGroup = this.root.append("g").attr("class","task_lines");
            this.margin = {top: 30, right: 40, bottom: 40, left: 80};
            
            
            
        }
                
        
        public static converter(dataView: DataView): GanttViewModel {
            var tasks: task[] = GanttChart.categoricalToTasks(dataView.categorical);
            var viewModel: GanttViewModel = {
                tasks: tasks,
                fixedHeight: 45,
                paddingLines: 0,
                paddingTasks: 0.15,
            };
            
            return viewModel;
        }
        
        
        
        
        public update(options: VisualUpdateOptions) {
            if (!options.dataViews && !options.dataViews[0]) return;
            
            
            var viewport = options.viewport;
            var viewModel: GanttViewModel = GanttChart.converter(options.dataViews[0]);
            this.viewModel = viewModel;
            
            //this.labelGroup.style('font-size', this.getFontSize()*0.33);
            
            
            var margin = this.margin;
            var width = viewport.width - margin.left - margin.right;
            var height = viewport.height - margin.top - margin.bottom;
            
            
            this.updateMisc(viewModel.tasks, width, height);
            this.updateTaskBars(viewModel.tasks);
            this.updateProgressBars(viewModel.tasks);
            this.updateMilestoneShapes(viewModel.tasks);
            this.updateNowLine(viewModel.tasks);
            
            
            this.updateLabels(viewModel.tasks);
            this.updateTaskLines(viewModel.tasks, width);
            
            TooltipManager.addTooltip(this.taskLines, 
                                     (tooltipEvent: TooltipEvent)=>tooltipEvent.data.tooltipInfo);
        }

        public destroy(): void {
            this.root = null;
        }

        
        
        /**
        * Update
        */
        private updateTaskBars(tasks: task[]): void{
               let bars = this.taskGroup.selectAll("rect")
                            .data(tasks.filter(function(task) {return task.shape==="none"}),
                                (task: task) => task.index);
            
                bars.enter()
                    .append("rect");
                bars
                    .attr("x", (task:task, i:number) => this.yScale(task.start))
                    .attr("y", (task:task, i:number) => this.getBarY(task.index))
                    .attr("width", (task:any, i:number) => this.taskDurationToWidth(task))
                    .attr("height", () => this.getBarHeight())
                    .style("fill", "none")
                    .style("stroke-width", 1)
                    .style("stroke", "black");
                bars.exit().
                    remove()
        }
    
        
        private getColorByIndex(index: number):string{
            return this.style.colorPalette.dataColors.getColorByIndex(index).value
        }
        
        private updateProgressBars(tasks: task[]): void{
           let bars = this.progressGroup.selectAll("rect")
                        .data(tasks.filter(function(task) {return task.shape==="none"}),
                            (task: task) => task.index);
            
            bars.enter()
                .append("rect");
            bars.attr("x", (task:task, i:number) => this.yScale(task.start))
                .attr("y", (task:task, i:number) => this.getBarY(task.index))
                .attr("width", (task : task, i) =>  this.taskProgress(task))
                .attr("height", () => this.getBarHeight())
                .style("fill", (task:task, i:number) => this.getColorByIndex(i));
            bars.exit().remove()
        }
        
        
        private updateMilestoneShapes(tasks:task[]): void{
            let milestones = this.milestoneGroup.selectAll("path")
                        .data(tasks.filter(function(task) {return task.shape != "none"}),
                            (task: task) => task.index);
            milestones.enter()
                        .append("path")
                        .attr('d', this.getMilestone())
                        .attr("transform", (task:task, i:number) => this.getMilestonePos(task))
                        .style("fill", "black");    
            milestones.exit().remove();
        }
        
        private updateNowLine(tasks:task[]): void{
            this.chartGroup.selectAll("line").remove();    
            this.nowLine = this.chartGroup.append("line")
                    .attr("x1",  this.yScale(Date.now()))
                    .attr("y1", 0)
                    .attr("x2",  this.yScale(Date.now()))
                    .attr("y2",  this.getNowlineY())
                    .attr("stroke-width", 2)
                    .style("stroke-dasharray", ("3, 3"))
                    .style("stroke", "black");
        }
        
        private updateLabels(tasks: task[]): void {
            let labels = this.labelGroup.selectAll("text")
                            .data(tasks)
            labels.enter()
                .append("text")
                .attr("class", "title")
                .attr("x", 10)
                .attr("y", (task:task, i:number) => this.getLabelY(task.index) )
                .attr("fill", function(task) {return "black"})
                .attr("stroke-width", 1)
                .text(function(task) {return task.name});    
            labels.exit().remove()
        }
        
        
        private updateTaskLines(tasks: task[], width: number): void {
            this.lineGroup.selectAll("rect").remove()
            this.taskLines = this.lineGroup.selectAll("rect")
                .data(tasks)
                .enter()
                .append("rect")
                .attr("class", "task_line")
                .attr("x", 0)
                .attr("y", (task:task, i:number) => this.getBarLineY(task.index))
                .attr("width", width + this.margin.left + this.margin.right)
                .attr("height", () => this.getBarLineHeight() )
                .attr("fill", "black")
                .attr("opacity", (task:task, i:number) => this.getTasklineOpacity(i));
                }
        
        
        private updateMisc(tasks: task[], width: number, height: number){
            
            
            
            var margin = this.margin;
            var t1 = tasks[0].start;
            var t2 = tasks[tasks.length - 1].end;
            
            this.xScale = this.xScale.range([0, height]).domain([0,tasks.length]);
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
            this.lineGroup.attr("transform", "translate(" + 0 + "," + margin.top + ")");    
            this.labelGroup.attr("transform", "translate(" + 0 + "," + margin.top + ")");    
        }
        
        
        /**
        * Misc
        */
        private getTasklineOpacity(i: number):number{
                var opacity:number;
                if (i%2) {
                    opacity = 0;    
                }
                else{
                    opacity = 0.04;    
                }
            return opacity;
        }
        
        
        private  tailorText(text:string):string{
            var textProperties: TextProperties = 
                {text:text, 
                fontFamily:"helvetica",
                fontSize: this.getFontSize().toString()}    
            var result:string = 
                TextMeasurementService.getTailoredTextOrDefault(textProperties,
                                                                this.margin.left)
            return result;
        }   
        
        private getNowlineY(){
            var taskNumber:number = this.viewModel.tasks.length
            return taskNumber * this.viewModel.fixedHeight;
        }
        
        private getFontSize(): number{
            var m = this.viewModel;
            var y = (m.fixedHeight) -(m.fixedHeight * m.paddingTasks * 2);
            return y;
        }
        
        private getLabelY(i: number): number{
            var m = this.viewModel;
            var y = (m.fixedHeight *i)+(m.fixedHeight * m.paddingTasks) + this.getFontSize();
            //FIXXXXME
            y = y -16;
            return y;
        }
        
        private getBarY(i: number): number{
            var m = this.viewModel;
            var y = (m.fixedHeight *i)+(m.fixedHeight * m.paddingTasks);
            return y;
        }
        
        private getBarHeight(): number{
            var m = this.viewModel;
            var height = m.fixedHeight-(m.fixedHeight * m.paddingTasks*2);
            return height;
        }
        
        private getBarLineY(i: number): number{
            var m = this.viewModel;
            var y = (m.fixedHeight *i)+(m.fixedHeight * m.paddingLines);
            return y;
        }
        
        private getBarLineHeight(): number{
            var m = this.viewModel;
            var height = m.fixedHeight-(m.fixedHeight * m.paddingLines*2);
            return height;
        }
        
        private taskProgress(task: task): number{
            var fraction = (task.completion/100)
            var y = this.yScale;
            var progress = (y(task.end)-y(task.start)) * fraction;
            return progress;
        }
                
        private getMilestone(): any{
            var arc = d3.svg.symbol().type('triangle-up').size(80);
            return arc;
        }
        
        private  getMilestonePos(task: task): string{
            var m = this.viewModel;
            var transform = "translate(" + this.yScale(task.start) +"," + (task.index+0.5)*m.fixedHeight + ")";
            return transform;
        }
                
        private taskDurationToWidth(task:task): number{
            var width = this.yScale(task.end) - this.yScale(task.start);
            return width;
        }
    

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] {
            var instances: VisualObjectInstance[] = [];
            return instances;
        }
        
        private static categoricalToTasks(data: DataViewCategorical): task[]{
            var roles: string[] = [
                "id",
                "description",
                "resource",
                "group",
                "start",
                "end",
                "completion",
                "name",
                "shape",
            ];
            var maxIndex: number = data.categories[0].values.length;
            
            // init task dict with nulls
            var roleToValues : taskDict = {};
            for (let role of roles){
                console.log(role)
                var roleDict: {[index:number]:string} = {}
                for (let i:number = 0; i < maxIndex; i++) {
                    roleDict[i] = null;
                }
                roleToValues[role] = roleDict;
            }
                    
            // update with values
            for (let valueCol of data.values){
                var col:DataViewValueColumn = valueCol;
                var active_role:string = null;
                
                for (let role of roles){
                    if (col.source.roles[role]){
                        active_role = role;
                    }
                }
                var roleDict: {[index:number]:string} = roleToValues[active_role];
                var values = col.values;
                    for (let index in values){
                        roleDict[index] = values[index];
                    }
                roleToValues[active_role] = roleDict;
            }
            
            // update with categories
            for (let catCol of data.categories){
                let col:DataViewCategoryColumn = catCol;
                var active_role:string = null;
                
                for (let role of roles){
                    if (col.source.roles[role]){
                        active_role = role;
                    }
                }
                var roleDict: {[index:number]:string} = roleToValues[active_role];
                var values = col.values;
                    for (let index in values){
                        roleDict[index] = values[index];
                    }
                roleToValues[active_role] = roleDict;
            }
            
            
            console.log("Set up task dict");
            console.log(JSON.stringify(roleToValues));
            
            
            var tasks: task[] = [];
            for (let i:number = 0; i < maxIndex; i++) {
                console.log("Working in task: " +i)
                                        
                var currentTask: task = {
                    index: i,
                    shape: "none",
                    description: "",
                    resource: "",
                    id: "ID"+i,
                    group: null, 
                    end: null,
                    start: null,
                    color: "green",
                    completion: null,
                    name: "Task "+i,
                    tooltipInfo: [{displayName: "Task: "+i, value: "Tooltip "+i}]
                };
                
                
                
                for (let role of roles){
                    console.log("Working in role: " + role)
                    var roleDict: {[index:number]:string} = roleToValues[role];
                    currentTask[role] = roleDict[i];
                    
                }
                currentTask.tooltipInfo[0].displayName = currentTask.name;
                currentTask.tooltipInfo[0].value = "["+currentTask.description+ ", " +currentTask.resource+", " + currentTask.id + "]";
                tasks.push(currentTask);
            }
                
            
            console.log(JSON.stringify(tasks));
            
            return tasks;
        }

    }
}
