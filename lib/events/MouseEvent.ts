import { MouseEvent as MouseEventAway } from '@awayjs/scene';
import { Event } from './Event';
import { notImplemented } from '@awayfl/swf-loader';
import { InteractiveObject } from '../display/InteractiveObject';
import { Point } from '../geom/Point';
import { DisplayObject } from '../display/DisplayObject';

/**
 * Copyright 2014 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// Class: MouseEvent
export class MouseEvent extends Event {

	static classInitializer: any = null;

	static classSymbols: string [] = null;
	static instanceSymbols: string [] = null;

	constructor(type: string, bubbles: boolean = true, cancelable: boolean = false,
		localX: number = undefined, localY: number = undefined,
		relatedObject: InteractiveObject = null, ctrlKey: boolean = false,
		altKey: boolean = false, shiftKey: boolean = false, buttonDown: boolean = false,
		delta: number /*int*/ = 0) {
		super(type, bubbles, cancelable);
		this._localX = localX;
		this._localY = localY;
		this._relatedObject = relatedObject;
		this._ctrlKey = ctrlKey;
		this._altKey = altKey;
		this._shiftKey = shiftKey;
		this._buttonDown = buttonDown;
		this._delta = delta;
	}

	// JS -> AS Bindings
	static CLICK: string = 'click';
	static DOUBLE_CLICK: string = 'doubleClick';
	static MOUSE_DOWN: string = 'mouseDown';
	static MOUSE_MOVE: string = 'mouseMove';
	static MOUSE_OUT: string = 'mouseOut';
	static MOUSE_OVER: string = 'mouseOver';
	static MOUSE_UP: string = 'mouseUp';
	static RELEASE_OUTSIDE: string = 'releaseOutside';
	static MOUSE_WHEEL: string = 'mouseWheel';
	static ROLL_OUT: string = 'rollOut';
	static ROLL_OVER: string = 'rollOver';
	static MIDDLE_CLICK: string = 'middleClick';
	static MIDDLE_MOUSE_DOWN: string = 'middleMouseDown';
	static MIDDLE_MOUSE_UP: string = 'middleMouseUp';
	static RIGHT_CLICK: string = 'rightClick';
	static RIGHT_MOUSE_DOWN: string = 'rightMouseDown';
	static RIGHT_MOUSE_UP: string = 'rightMouseUp';
	static CONTEXT_MENU: string = 'contextMenu';

	/**
   * AS3 mouse event names don't match DOM even names, so map them here.
   */
	static typeFromDOMType(name: string): string {
		switch (name) {
			case 'click':
				return MouseEvent.CLICK;
			case 'dblclick':
				return MouseEvent.DOUBLE_CLICK;
			case 'mousedown':
				return MouseEvent.MOUSE_DOWN;
			case 'mouseout':
			case 'mouseover':
			case 'mousemove':
				return MouseEvent.MOUSE_MOVE;
			case 'mouseup':
				return MouseEvent.MOUSE_UP;
			default:
				notImplemented(name);
        // return MouseEvent.RELEASE_OUTSIDE;
        // return MouseEvent.MOUSE_WHEEL;
        // return MouseEvent.ROLL_OUT;
        // return MouseEvent.ROLL_OVER;
        // return MouseEvent.MIDDLE_CLICK;
        // return MouseEvent.MIDDLE_MOUSE_DOWN;
        // return MouseEvent.MIDDLE_MOUSE_UP;
        // return MouseEvent.RIGHT_CLICK;
        // return MouseEvent.RIGHT_MOUSE_DOWN;
        // return MouseEvent.RIGHT_MOUSE_UP;
        // return MouseEvent.CONTEXT_MENU;
		}
	}

	/* added to clone events from away to as3web. */
	public fillFromAway (awayEvent: MouseEventAway) {
		//console.log("cloneFromAway not implemented yet in flash/MouseEvent");

		this.adaptee = awayEvent;
		// todo: set targets correctly
		this.target = awayEvent.target.adapter;
		this.currentTarget = awayEvent.currentTarget.adapter;

		this.delta = awayEvent.delta;

		this.ctrlKey = awayEvent.ctrlKey;
		this.shiftKey = awayEvent.shiftKey;

		//this._stageX = awayEvent.screenX;
		//this._stageY = awayEvent.screenY;

		//todo: translate more stuff from awayjs to as3

		//result.screenX = this.screenX;
		//result.screenY = this.screenY;
		/*
		result.view = awayEvent.view;
		result.entity = awayEvent.entity;
		result.renderable = awayEvent.renderable;
		result.material = awayEvent.material;
		result.uv = awayEvent.uv;
		result.position = awayEvent.position;
		result.normal = awayEvent.normal;
		result.elementIndex = awayEvent.elementIndex;
*/
		//result._iParentEvent = awayEvent;
		//result._iAllowedToPropagate = awayEvent._iAllowedToPropagate;

	}

	// AS -> JS Bindings
	private _localX: number;
	private _localY: number;
	private _movementX: number;
	private _movementY: number;
	private _delta: number;
	private _position: Point;

	private _ctrlKey: boolean;
	private _altKey: boolean;
	private _shiftKey: boolean;

	private _buttonDown: boolean;
	private adaptee: MouseEventAway;

	private _relatedObject: InteractiveObject;
	private _isRelatedObjectInaccessible: boolean;

	get localX(): number {
		return (this._localX / 20) | 0;
	}

	set localX(value: number) {
		this._localX = (value * 20) | 0;
	}

	get localY(): number {
		return (this._localY / 20) | 0;
	}

	set localY(value: number) {
		this._localY = (value * 20) | 0;
	}

	public get stageX(): Number {
		if (isNaN(this.localX + this.localY)) {
			return Number.NaN;
		}

		return (<DisplayObject> this.target).stage.mouseX;
	}

	public get stageY(): Number {
		if (isNaN(this.localX + this.localY)) {
			return Number.NaN;
		}

		return (<DisplayObject> this.target).stage.mouseY;
	}

	get movementX(): number {
		return this._movementX || 0;
	}

	set movementX(value: number) {
		this._movementX = +value;
	}

	get movementY(): number {
		return this._movementY || 0;
	}

	set movementY(value: number) {
		this._movementY = +value;
	}

	public get delta(): number {
		return this._delta;
	}

	public set delta(value: number) {
		this._delta = value;
	}

	public get ctrlKey(): boolean {
		return this._ctrlKey;
	}

	public set ctrlKey(value: boolean) {
		this._ctrlKey = value;
	}

	public get altKey(): boolean {
		return this._altKey;
	}

	public set altKey(value: boolean) {
		this._altKey = value;
	}

	public get shiftKey(): boolean {
		return this._shiftKey;
	}

	public set shiftKey(value: boolean) {
		this._shiftKey = value;
	}

	public get buttonDown(): boolean {
		return this._buttonDown;
	}

	public set buttonDown(value: boolean) {
		this._buttonDown = value;
	}

	public get relatedObject(): InteractiveObject {
		return this._relatedObject;
	}

	public set relatedObject(value: InteractiveObject) {
		this._relatedObject = value;
	}

	public get isRelatedObjectInaccessible(): boolean {
		return this._isRelatedObjectInaccessible;
	}

	public set isRelatedObjectInaccessible(value: boolean) {
		this._isRelatedObjectInaccessible = value;
	}

	updateAfterEvent(): void {
		this.sec.player.requestRender();
	}

	clone(): Event {
		return new MouseEvent(this.type, this.bubbles,
			this.cancelable,
			this.localX, this.localY,
			this.relatedObject, this.ctrlKey,
			this.altKey, this.shiftKey,
			this.buttonDown, this.delta);
	}

	toString(): string {
		return this.formatToString('MouseEvent', 'type', 'bubbles', 'cancelable', 'eventPhase',
			'localX', 'localY', 'relatedObject', 'ctrlKey', 'altKey',
			'shiftKey', 'buttonDown', 'delta');
	}
}