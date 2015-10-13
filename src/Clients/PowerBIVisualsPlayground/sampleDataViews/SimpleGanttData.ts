/*
*  Power BI Visualizations
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved. 
*  MIT License
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

/// <reference path="../_references.ts"/>

module powerbi.visuals.sampleDataViews {
    import DataViewTransform = powerbi.data.DataViewTransform;

    interface task{
        shape: string,
        start: Date,
        end: Date,
        group: string,
        completion: number,
    }
    
    export class SimpleGanttData extends SampleDataViews implements ISampleDataViewsMethods {

        public name: string = "SimpleGanttData";
        public displayName: string = "Gantt Data";

        public visuals: string[] = ['ganttChart'];
        
        private currenetTaskId: number;
        private currentDate: Date;
        
        private groupValues: string[];
        private startValues: Date[];
        private endValues: Date[];
        private durationValues: number[];
        private nameValues: string[];
        private shapeValues: string[];
        private resourceValues: string[];
        private descriptionValues: string[];
        private idValues: string[];                

        
        public getDataViews(): DataView[] {

            let fieldExpr = powerbi.data.SQExprBuilder.fieldExpr({ column: { schema: 's', entity: "table1", name: "country" } });

            
            
            let idToMetaColumns : {[id: string]: DataViewMetadataColumn;} = {};
            
        if (this.groupValues === undefined){
            this.randomize();
        }
            
            idToMetaColumns["id"] = 
            {
                        displayName: 'ID',
                        isMeasure: false,
                        queryName: 'id',
                        roles: {"id": true},
                        type: powerbi.ValueType.fromDescriptor({ text: true })
            };
            idToMetaColumns["description"] = 
            {
                        displayName: 'Description',
                        isMeasure: false,
                        queryName: 'description',
                        roles: {"description": true},
                        type: powerbi.ValueType.fromDescriptor({ text: true })
            };
            idToMetaColumns["resource"] = 
            {
                        displayName: 'Resource',
                        isMeasure: false,
                        queryName: 'resource',
                        roles: {"resource": true},
                        type: powerbi.ValueType.fromDescriptor({ text: true })
            };
            idToMetaColumns["shape"] = 
            {
                        displayName: 'Shape',
                        isMeasure: false,
                        queryName: 'shape',
                        roles: {"shape": true},
                        type: powerbi.ValueType.fromDescriptor({ text: true })
            };
            idToMetaColumns["name"] = 
            {
                        displayName: 'Name',
                        isMeasure: false,
                        queryName: 'name',
                        roles: {"name": true},
                        type: powerbi.ValueType.fromDescriptor({ text: true })
            };
            idToMetaColumns["group"] = 
            {
                        displayName: 'Group',
                        isMeasure: false,
                        queryName: 'group',
                        roles: {"group": true},
                        type: powerbi.ValueType.fromDescriptor({ text: true })
            };
            idToMetaColumns["start"] = 
            {
                        displayName: 'Start Date',
                        groupName: 'Start Date',
                        isMeasure: false,
                        queryName: "startDate",
                        roles: { "start": true },
                        type: powerbi.ValueType.fromDescriptor({ text: true })            
            };
            idToMetaColumns["end"] = 
            {
                        displayName: 'End Date',
                        groupName: 'End Date',
                        isMeasure: false,
                        queryName: "endDate",
                        roles: { "end": true },
                        type: powerbi.ValueType.fromDescriptor({ text: true })            
            };
            idToMetaColumns["completion"] = 
            {
                        displayName: 'Completion',
                        groupName: 'Completion',
                        isMeasure: true,
                        queryName: "completion",
                        roles: { "completion": true },
                        type: powerbi.ValueType.fromDescriptor({ numeric: true })            
            };
            
            
            
            // Metadata, describes the data columns, and provides the visual with hints
            // so it can decide how to best represent the data
            let dataViewMetadata: powerbi.DataViewMetadata = {
                    columns: [
                            idToMetaColumns["id"],
                            idToMetaColumns["description"],
                            idToMetaColumns["resource"],
                            idToMetaColumns["shape"],
                            idToMetaColumns["name"],
                            idToMetaColumns["group"],
                            idToMetaColumns["start"],
                            idToMetaColumns["end"],
                            idToMetaColumns["completion"],
                ],
                objects: { categoryLabels: { show: true } },
            };
            
            let columns = [
                {
                    source: idToMetaColumns["completion"],
                    values: this.durationValues,
                }];
                        
            let dataValues: DataViewValueColumns = DataViewTransform.createValueColumns(columns);
            
            return [{
                metadata: dataViewMetadata,
                    categorical: {
                        categories: [
                        {
                            source: idToMetaColumns["id"],
                            values: this.idValues,
                        },
                        {
                            source: idToMetaColumns["description"],
                            values: this.descriptionValues,
                        },
                        {
                            source: idToMetaColumns["resource"],
                            values: this.resourceValues,
                        },
                        {
                            source: idToMetaColumns["shape"],
                            values: this.shapeValues,
                        },
                        {
                            source: idToMetaColumns["name"],
                            values: this.nameValues,
                        },
                        {
                            source: idToMetaColumns["group"],
                            values: this.groupValues,
                        },
                        {
                            source: idToMetaColumns["start"],
                            values: this.startValues,
                        },
                        {
                            source: idToMetaColumns["end"],
                            values: this.endValues,
                        }    
                        ],
                        values: dataValues
                    }
                }];
        }
        
        private getRandomTask():task{
            var start: Date = this.currentDate;
            var shape:string = _.sample(["none","none","none","none","none","none","none",
                                        "circle","triangle", "star"]);
            
            if (shape === "none"){
                this.currentDate = d3.time.hour.offset(this.currentDate, _.sample([24,48,72]));    
            }
            
            var new_task: task ={
                shape: shape,
                start: start,
                end: this.currentDate,
                group: _.sample(["A","B"]),
                completion: _.sample([10,20,30,40,50,60,70,80,90,100])
            }   
            return new_task;
        }
        
        public randomize(): void {
            var maxTask:number = _.sample([1,2,3,4,5,6,7,8,9,10]);
            this.startValues = [];
            this.endValues = [];
            this.durationValues = [];
            this.groupValues = [];
            this.nameValues = [];
            this.shapeValues = [];
            this.resourceValues = [];
            this.descriptionValues = [];
            this.idValues = []
            this.currenetTaskId = 0;
            this.currentDate = new Date(Date.now());
            this.currentDate = d3.time.hour.offset(this.currentDate, _.sample([-24,-48,-72]));    
            for (let i = 0; i < maxTask; i++) {
                var new_task: task = this.getRandomTask()
                this.startValues.push(new_task.start)
                this.endValues.push(new_task.end)
                this.durationValues.push(new_task.completion)
                this.groupValues.push(new_task.group)    
                this.shapeValues.push(new_task.shape)
                this.resourceValues.push(_.sample(["R1","R2"]));
                this.descriptionValues.push("Description " + i);
                this.idValues.push(i.toString());
                if (new_task.shape === "none"){
                    this.nameValues.push("Task: "+i)
                }
                else{
                    this.nameValues.push("Milestone")                
                }
                        
            }
            
            
            
        }
        
    }
}