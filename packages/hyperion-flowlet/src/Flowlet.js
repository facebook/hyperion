/**
 * Copyright (c) Meta Platforms, Inc. and affiliates. All Rights Reserved.
 */
export class Flowlet {
    name;
    parent;
    data;
    fullName;
    constructor(name, parent) {
        this.name = name;
        this.parent = parent;
        this.fullName = `${this.parent?.fullName ?? ""}/${this.name}`;
        this.data = Object.create(parent?.data ?? null);
    }
    fork(name) {
        return new Flowlet(name, this);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmxvd2xldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkZsb3dsZXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7O0dBRUc7QUFFSCxNQUFNLE9BQU8sT0FBTztJQUlBO0lBQ0E7SUFKVCxJQUFJLENBQUk7SUFDUixRQUFRLENBQVM7SUFDMUIsWUFDa0IsSUFBWSxFQUNaLE1BQW1CO1FBRG5CLFNBQUksR0FBSixJQUFJLENBQVE7UUFDWixXQUFNLEdBQU4sTUFBTSxDQUFhO1FBRW5DLElBQUksQ0FBQyxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLFFBQVEsSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzlELElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxJQUFJLElBQUksQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFRCxJQUFJLENBQUMsSUFBWTtRQUNmLE9BQU8sSUFBSSxPQUFPLENBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FDRiJ9