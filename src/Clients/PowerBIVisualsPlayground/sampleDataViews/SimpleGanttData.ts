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
    import ValueType = powerbi.ValueType;
    import PrimitiveType = powerbi.PrimitiveType;
    
    export class SimpleGanttData extends SampleDataViews implements ISampleDataViewsMethods {

        public name: string = "SimpleGanttData";
        public displayName: string = "Simple Gantt data";

        public visuals: string[] = ['ganttChart',
        ];

        public getDataViews(): DataView[] {
            var dataTypeNumber = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Double);
            var dataTypeString = ValueType.fromPrimitiveTypeAndCategory(PrimitiveType.Text);            

            var groupSource1: DataViewMetadataColumn = { displayName: 'group1', type: dataTypeString, index: 0 };
            var groupSource2: DataViewMetadataColumn = { displayName: 'group2', type: dataTypeString, index: 1 };
            var groupSource3: DataViewMetadataColumn = { displayName: 'group3', type: dataTypeString, index: 2 };

            

            return [{
                metadata: { columns: [groupSource1, groupSource2, groupSource3] },
                table: {
                    columns: [groupSource1, groupSource2, groupSource3],
                    rows: [["1","Task 1","2014-12-31T23:00:00.000Z","2015-01-03T23:00:00.000Z","red","Yvonne","A","30","B","none",72],["2","Task2","2015-01-03T23:00:00.000Z","2015-01-06T23:00:00.000Z","red","Yvonne","A","50","C","none",72],["3","Milestone","2015-01-06T23:00:00.000Z","2015-01-06T23:00:00.000Z","black","Ruth","B","40","C","triangle",0],
["4","Task 4","2015-01-06T23:00:00.000Z","2015-01-09T23:00:00.000Z","green","Owen","A","80","B","none",72],
["5","Task 5","2015-01-09T23:00:00.000Z","2015-01-11T23:00:00.000Z","blue","Tracey","B","30","B","none",48],
["6","Task 6","2015-01-11T23:00:00.000Z","2015-01-13T23:00:00.000Z","blue","Ruth","B","90","C","none",48],
["7","Task 7","2015-01-13T23:00:00.000Z","2015-01-16T23:00:00.000Z","green","Owen","A","40","A","none",72],
["8","Task 8","2015-01-16T23:00:00.000Z","2015-01-17T23:00:00.000Z","red","Tracey","B","70","B","none",24],
["9","Task 9","2015-01-17T23:00:00.000Z","2015-01-18T23:00:00.000Z","red","Tracey","B","100","A","none",24],
["10","Task 10","2015-01-18T23:00:00.000Z","2015-01-20T23:00:00.000Z","green","Yvonne","A","10","C","none",48]]
                }
            }];
        }

        public randomize(): void {
        }
        
    }
}