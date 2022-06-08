/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
export class Flowlet {
    name;
    parent;
    data;
    _fullName;
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
        this._fullName = `${this.parent?.fullName() ?? ""}/${this.name}`;
        this.data = Object.create(parent?.data ?? null);
    }
    fullName() {
        return this._fullName;
    }
    fork(name) {
        return new Flowlet(name, this);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZsb3dsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxNQUFNLE9BQU8sT0FBTztJQUlBO0lBQ0E7SUFKVCxJQUFJLENBQUk7SUFDQSxTQUFTLENBQVM7SUFDbkMsWUFDa0IsSUFBWSxFQUNaLE1BQW1CO1FBRG5CLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixXQUFNLEdBQU4sTUFBTSxDQUFhO1FBRW5DLElBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDakUsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxJQUFJLElBQUksSUFBSSxDQUFDLENBQUM7SUFDbEQsQ0FBQztJQUVELFFBQVE7UUFDTixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7SUFDeEIsQ0FBQztJQUVELElBQUksQ0FBQyxJQUFZO1FBQ2YsT0FBTyxJQUFJLE9BQU8sQ0FBSSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztDQUNGIn0=