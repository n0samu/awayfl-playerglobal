import {
	ABCFile,
	ABCCatalog,
	ActiveLoaderContext,
	AVM2LoadLibrariesFlags,
	IPlayerGlobal,
	AXSecurityDomain,
	Natives,
} from '@awayfl/avm2';
import { release, assert, PromiseWrapper, AVMStage, SWFFile } from '@awayfl/swf-loader';
import { SecurityDomain } from './SecurityDomain';
import { initLink } from './link';
import {
	ISceneGraphFactory,
	TextField,
	SceneImage2D,
	Font,
	Sprite,
	MovieClip,
	MorphSprite,
	IDisplayObjectAdapter,
	FrameScriptManager,
} from '@awayjs/scene';

import { LoaderContext } from './system/LoaderContext';
import { FlashSceneGraphFactory } from './factories/FlashSceneGraphFactory';
import { AssetBase, IAsset, WaveAudio } from '@awayjs/core';
import { ApplicationDomain } from './system/ApplicationDomain';
import { BitmapImage2D } from '@awayjs/stage';
import { Graphics } from '@awayjs/graphics';
import { Stage } from './display/Stage';
import { DisplayObject } from './display/DisplayObject';
import { LoaderInfo } from './display/LoaderInfo';
import { ILoader } from './ILoader';

export class PlayerGlobal implements IPlayerGlobal, ILoader {
	private _contentLoaderInfo: LoaderInfo;
	private _content: DisplayObject;
	private _avmStage: AVMStage;
	private _stage: Stage;
	private _applicationDomain: ApplicationDomain;

	public get stage(): Stage {
		return this._stage;
	}

	public get content(): DisplayObject {
		return this._content;
	}

	public createSecurityDomain(
		avmStage: AVMStage,
		swfFile: SWFFile,
		libraries: AVM2LoadLibrariesFlags
	): Promise<ISceneGraphFactory> {
		this._avmStage = avmStage;

		if (this._avmStage.avmTestHandler) {
			Natives.print = function (sec: AXSecurityDomain, expression: any) {
				let message = '';

				if (arguments.length == 2) {
					message = arguments[1]?.toString();
				} else {
					for (let i = 1; i < arguments.length; i++) {
						// eslint-disable-next-line prefer-rest-params
						message += arguments[i]?.toString();
						if (i !== arguments.length - 1) {
							message += ' ';
						}
					}
				}

				const messageSplit = message.split('\n');
				for (let i = 0; i < messageSplit.length; i++) {
					console.log('%c Test-Trace from SWF:', 'color: DodgerBlue', messageSplit[i]);
					avmStage.avmTestHandler.addMessage(messageSplit[i]);
				}
			};
		}

		initLink();

		const result = new PromiseWrapper<ISceneGraphFactory>();
		release || console.log('createSecurityDomain');
		release || assert(!!(libraries & AVM2LoadLibrariesFlags.Builtin));
		release || console.log('Load builtin.abc file');
		BrowserSystemResourcesLoadingService.getInstance()
			.load('./assets/builtins/builtin.abc', 'arraybuffer')
			.then((buffer) => {
				const sec = new SecurityDomain();
				const env = { url: 'builtin.abc', app: sec.system };
				const builtinABC = new ABCFile(env, new Uint8Array(buffer));
				(<any>sec).swfVersion = swfFile.swfVersion;
				sec.system.loadABC(builtinABC);
				sec.initialize();
				sec.system.executeABC(builtinABC);
				sec.player = avmStage;
				//SWF.leaveTimeline();

				//// If library is shell.abc, then just go ahead and run it now since
				//// it's not worth doing it lazily given that it is so small.
				//if (!!(libraries & AVM2LoadLibrariesFlags.Shell)) {
				//  var shellABC = new Shumway.AVMX.ABCFile(new Uint8Array(buffer));
				//  sec.system.loadAndExecuteABC(shellABC);
				//  result.resolve(sec);
				//  SystemResourcesLoadingService.instance.load(SystemResourceId.ShellAbc).then(function (buffer) {
				//    var shellABC = new Shumway.AVMX.ABCFile(new Uint8Array(buffer));
				//    sec.system.loadAndExecuteABC(shellABC);
				//    result.resolve(sec);
				//  }, result.reject);
				//  return;
				//}

				if (libraries & AVM2LoadLibrariesFlags.Playerglobal) {
					return Promise.all([
						BrowserSystemResourcesLoadingService.getInstance().load(
							'./assets/builtins/playerglobal.abcs',
							'arraybuffer'
						),
						BrowserSystemResourcesLoadingService.getInstance().load(
							'./assets/builtins/playerglobal.json',
							'json'
						),
					]).then((results) => {
						release || console.log('Load playerglobal.abcs & playerglobal.json');
						const catalog = new ABCCatalog(sec.system, new Uint8Array(results[0]), results[1]);
						release || console.log('add playerglobals as ABCCatalog');
						sec.addCatalog(catalog);

						BrowserSystemResourcesLoadingService.getInstance()
							.load('./assets/builtins/avmplus.abc', 'arraybuffer')
							.then((buffer) => {
								//var sec = new AXSecurityDomain();
								const env = { url: 'avmplus.File', app: sec.system };
								const avmPlusABC = new ABCFile(env, new Uint8Array(buffer));
								sec.system.loadABC(avmPlusABC);
								//sec.initialize();
								sec.system.executeABC(avmPlusABC);
							}, result.reject)
							.then(() => {
								this._contentLoaderInfo = new sec.flash.display.LoaderInfo(this, this._avmStage);
								this._contentLoaderInfo.url = swfFile.url;
								this._applicationDomain = new sec.flash.system.ApplicationDomain();
								const loaderContext: LoaderContext = new sec.flash.system.LoaderContext(
									false,
									this._applicationDomain
								);
								ActiveLoaderContext.loaderContext = loaderContext;
								this._stage = new sec.flash.display.Stage();
								sec.flash.display.DisplayObject.axClass._activeStage = this._stage;
								this._avmStage.adapter = this._stage;
								this._stage.adaptee = this._avmStage;
								result.resolve(new FlashSceneGraphFactory(sec));
							}, result.reject);
					}, result.reject);
				}
				// todo: is this needed:
				result.resolve(null);
			}, result.reject);
		return result.promise;
	}

	public enterFrame() {
		this._stage && this._stage.enterFrame();
	}

	public resizeStage() {
		// it can happen that resizeStage is called before createSecurityDomain has finished and stage exists
		this._stage && this._stage.resizeCallback();
	}

	public addAsset(asset: IAsset, addScene: boolean) {
		(<any>asset.adapter).loaderInfo = this._contentLoaderInfo;
		switch (asset.assetType) {
			case TextField.assetType: {
				this._applicationDomain.addDefinition(asset.name, <TextField>asset);
				break;
			}
			case SceneImage2D.assetType:
			case BitmapImage2D.assetType: {
				this._applicationDomain.addDefinition(asset.name, <SceneImage2D>asset);
				break;
				// we should only do this for bitmaps loaded from jpg or png
				// todo:
				//if (this._isImage)
				//	(<AwayDisplayObjectContainer> this._adaptee).addChild(
				//	new Bitmap(<BitmapData> (<SceneImage2D> asset).adapter).adaptee);
			}
			case WaveAudio.assetType: {
				this._applicationDomain.addAudioDefinition(asset.name, <WaveAudio>asset);
				break;
			}
			case Font.assetType: {
				this._applicationDomain.addFontDefinition(asset.name, <Font>asset);
				break;
			}
			case Sprite.assetType: {
				this._applicationDomain.addDefinition(asset.name, <Sprite>asset);
				break;
			}
			case MovieClip.assetType: {
				this._applicationDomain.addDefinition(asset.name, <MovieClip>asset);

				// if this is the "Scene 1", we make it a child of the loader
				if (addScene && (<any>asset).isAVMScene) {
					// "Scene 1" when AWDParser, isAVMScene when using SWFParser

					this._content = <DisplayObject>(<IDisplayObjectAdapter>asset.adapter).clone();
					this._content.loaderInfo = this._contentLoaderInfo;
					this._content.adaptee.reset();
					(<any> this._content.adaptee).firstFrameOnSWFStart = true;
					FrameScriptManager.invalidAS3Constructors = true;
					(<any> this._stage.adaptee).addChild(this._content.adaptee);
					FrameScriptManager.execute_as3_constructors_recursiv(<any> this._content.adaptee);
					this._content.dispatchStaticEvent('added', this._content);
					this._content.dispatch_ADDED_TO_STAGE(true);
				}
				break;
			}
			case '[asset Generic]': {
				this._applicationDomain.addDefinition(asset.name, asset as AssetBase);
				break;
			}
			case Graphics.assetType:
			case MorphSprite.assetType: {
				break;
			}
			default: {
				console.warn('Loaded unhandled asset-type', asset.assetType);
			}
		}
	}
}

class BrowserSystemResourcesLoadingService {
	private static _instance: BrowserSystemResourcesLoadingService;
	public static getInstance() {
		if (BrowserSystemResourcesLoadingService._instance) return BrowserSystemResourcesLoadingService._instance;
		return (BrowserSystemResourcesLoadingService._instance = new BrowserSystemResourcesLoadingService());
	}

	public constructor() {}

	public load(url, type): Promise<any> {
		return this._promiseFile(url, type);
	}

	private _promiseFile(path, responseType) {
		return new Promise(function (resolve, reject) {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', path);
			xhr.responseType = responseType;
			xhr.onload = function () {
				let response = xhr.response;
				if (response) {
					if (responseType === 'json' && xhr.responseType !== 'json') {
						response = JSON.parse(response);
					}
					resolve(response);
				} else {
					reject('Unable to load ' + path + ': ' + xhr.statusText);
				}
			};
			xhr.onerror = function () {
				reject('Unable to load: xhr error');
			};
			xhr.send();
		});
	}
}
