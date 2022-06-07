/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
export class Flowlet {
    name;
    parent;
    _fullName;
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
        this._fullName = `${this.parent?.fullName() ?? ""}/${this.name}`;
    }
    fullName() {
        return this._fullName;
    }
    fork(name) {
        return new Flowlet(name, this);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZsb3dsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxNQUFNLE9BQU8sT0FBTztJQUdBO0lBQ0E7SUFIRCxTQUFTLENBQVM7SUFDbkMsWUFDa0IsSUFBWSxFQUNaLE1BQWdCO1FBRGhCLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixXQUFNLEdBQU4sTUFBTSxDQUFVO1FBRWhDLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbkUsQ0FBQztJQUVELFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFZO1FBQ2YsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUNGIn0=